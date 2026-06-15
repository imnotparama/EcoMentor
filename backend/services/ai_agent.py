"""
EcoMentor AI Agent — Agentic loop using Claude with tool-use.

The agent autonomously calls tools to ground its analysis in real user data.
This is a true agentic pattern: Claude decides WHICH tools to call and WHEN,
based on the conversation context and its reasoning.

Tool flow for assessment analysis:
1. get_user_assessment → load user's carbon data
2. get_emission_benchmarks → compare against India/global averages
3. get_progress_history → identify trends over time
4. generate_challenge → create a personalized weekly challenge

Tool flow for chat:
- Any combination of the above, called as needed mid-conversation.
"""

import json
import logging
from typing import Any

import anthropic
from sqlalchemy.orm import Session

from models.db_models import Assessment, Challenge, ProgressEntry, Recommendation, User
from services.carbon_engine import INDIA_AVERAGE_MONTHLY_KG, GLOBAL_AVERAGE_MONTHLY_KG
from services.challenge_engine import generate_challenge_for_category

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Tool Definitions (Claude tool-use schema)
# ──────────────────────────────────────────────────────────────────────────────

AGENT_TOOLS: list[dict] = [
    {
        "name": "get_user_assessment",
        "description": (
            "Fetch the user's latest completed carbon assessment data, "
            "including category-level emission breakdown (transport, energy, "
            "food, shopping, waste), total monthly emissions, and sustainability score."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The user's ID as a string",
                }
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_emission_benchmarks",
        "description": (
            "Get India national average and global average emission benchmarks "
            "for comparison, optionally filtered to a specific category "
            "(transport, energy, food, shopping, waste)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": (
                        "Optional: specific category to get benchmarks for. "
                        "One of: transport, energy, food, shopping, waste, or 'all'."
                    ),
                }
            },
            "required": [],
        },
    },
    {
        "name": "get_progress_history",
        "description": (
            "Fetch the user's historical carbon footprint scores over past months "
            "to identify trends, improvements, or regressions."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The user's ID as a string",
                },
                "months": {
                    "type": "integer",
                    "description": "Number of past months to retrieve (default: 6)",
                },
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "generate_challenge",
        "description": (
            "Generate a personalized weekly eco-challenge for the user based on "
            "their highest emission category. Returns challenge title, description, "
            "duration, and estimated CO2 savings."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "The user's ID as a string",
                },
                "category": {
                    "type": "string",
                    "description": (
                        "Category to generate challenge for: "
                        "transport, energy, food, shopping, or waste"
                    ),
                },
            },
            "required": ["user_id", "category"],
        },
    },
]

BENCHMARKS: dict = {
    "all": {
        "india_monthly": INDIA_AVERAGE_MONTHLY_KG,
        "global_monthly": GLOBAL_AVERAGE_MONTHLY_KG,
        "categories": {
            "transport": {"india": 450.0, "global": 720.0},
            "energy": {"india": 620.0, "global": 900.0},
            "food": {"india": 500.0, "global": 1200.0},
            "shopping": {"india": 180.0, "global": 280.0},
            "waste": {"india": 150.0, "global": 233.0},
        },
    }
}


# ──────────────────────────────────────────────────────────────────────────────
# Tool Execution Functions
# ──────────────────────────────────────────────────────────────────────────────

def tool_get_user_assessment(user_id: str, db: Session) -> dict:
    """Fetch the latest assessment for a user."""
    try:
        uid = int(user_id)
    except ValueError:
        return {"error": "Invalid user_id"}

    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == uid, Assessment.is_complete == True)
        .order_by(Assessment.created_at.desc())
        .first()
    )

    if not assessment:
        return {"error": "No completed assessment found for this user"}

    user = db.query(User).filter(User.id == uid).first()

    return {
        "assessment_id": assessment.id,
        "user_name": user.name if user else "User",
        "city": user.city if user else "Unknown",
        "household_size": user.household_size if user else 1,
        "emissions": {
            "transport_monthly_kg": assessment.transport_emissions_monthly,
            "energy_monthly_kg": assessment.energy_emissions_monthly,
            "food_monthly_kg": assessment.food_emissions_monthly,
            "shopping_monthly_kg": assessment.shopping_emissions_monthly,
            "waste_monthly_kg": assessment.waste_emissions_monthly,
            "total_monthly_kg": assessment.total_monthly,
            "total_annual_kg": assessment.total_annual,
        },
        "sustainability_score": assessment.sustainability_score,
        "inputs": {
            "vehicle_type": assessment.vehicle_type,
            "diet_type": assessment.diet_type,
            "renewable_energy": assessment.renewable_energy,
            "recycling_habit": assessment.recycling_habit,
            "daily_distance_km": assessment.daily_distance_km,
            "monthly_electricity_kwh": assessment.monthly_electricity_kwh,
            "daily_ac_hours": assessment.daily_ac_hours,
        },
    }


def tool_get_emission_benchmarks(category: str = "all") -> dict:
    """Return benchmark data for comparison."""
    benchmarks = BENCHMARKS["all"]

    if category and category != "all" and category in benchmarks["categories"]:
        return {
            "category": category,
            "india_monthly_kg": benchmarks["categories"][category]["india"],
            "global_monthly_kg": benchmarks["categories"][category]["global"],
        }

    return {
        "india_total_monthly_kg": benchmarks["india_monthly"],
        "global_total_monthly_kg": benchmarks["global_monthly"],
        "category_benchmarks": benchmarks["categories"],
        "note": "All values in kg CO2 per month",
    }


def tool_get_progress_history(user_id: str, months: int = 6, db: Session = None) -> dict:
    """Fetch historical progress entries."""
    try:
        uid = int(user_id)
    except ValueError:
        return {"error": "Invalid user_id"}

    entries = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == uid)
        .order_by(ProgressEntry.created_at.desc())
        .limit(months)
        .all()
    )

    if not entries:
        return {"message": "No historical data available yet", "entries": []}

    history = [
        {
            "month_year": e.month_year,
            "total_monthly_kg": e.total_monthly,
            "sustainability_score": e.sustainability_score,
        }
        for e in reversed(entries)
    ]

    # Calculate trend
    if len(history) >= 2:
        delta = history[-1]["total_monthly_kg"] - history[0]["total_monthly_kg"]
        trend = "improving" if delta < 0 else "worsening" if delta > 0 else "stable"
    else:
        trend = "insufficient_data"

    return {
        "history": history,
        "months_tracked": len(history),
        "trend": trend,
    }


def tool_generate_challenge(user_id: str, category: str, db: Session) -> dict:
    """Generate a personalized challenge for the user."""
    try:
        uid = int(user_id)
    except ValueError:
        return {"error": "Invalid user_id"}

    challenge_data = generate_challenge_for_category(category)

    return {
        "challenge_title": challenge_data["title"],
        "description": challenge_data["description"],
        "category": category,
        "duration_days": challenge_data["duration_days"],
        "estimated_co2_saving_kg": challenge_data["estimated_co2_saving_kg"],
        "tips": challenge_data.get("tips", []),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Tool Dispatcher
# ──────────────────────────────────────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: dict[str, Any], db: Session) -> str:
    """Dispatch a tool call and return the result as a JSON string."""
    logger.info(f"Agent executing tool: {tool_name} with input: {tool_input}")

    try:
        if tool_name == "get_user_assessment":
            result = tool_get_user_assessment(
                user_id=tool_input.get("user_id", ""), db=db
            )
        elif tool_name == "get_emission_benchmarks":
            result = tool_get_emission_benchmarks(
                category=tool_input.get("category", "all")
            )
        elif tool_name == "get_progress_history":
            result = tool_get_progress_history(
                user_id=tool_input.get("user_id", ""),
                months=tool_input.get("months", 6),
                db=db,
            )
        elif tool_name == "generate_challenge":
            result = tool_generate_challenge(
                user_id=tool_input.get("user_id", ""),
                category=tool_input.get("category", "energy"),
                db=db,
            )
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
    except Exception as e:
        logger.error(f"Tool execution error ({tool_name}): {e}")
        result = {"error": str(e)}

    return json.dumps(result)


# ──────────────────────────────────────────────────────────────────────────────
# Agentic Loop
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are EcoMentor, an expert AI sustainability coach with deep knowledge of carbon footprints, climate science, and behavioral change. You help users understand their environmental impact and take meaningful action.

You have access to tools that let you fetch real data about the user's carbon footprint. Always use these tools to ground your analysis in actual data rather than making assumptions. 

Your communication style:
- Empowering, not guilt-inducing
- Specific and data-driven (cite actual kg CO2 numbers)
- Practical (give actionable, realistic advice for India)
- Warm and encouraging

When analyzing a user's footprint:
1. First call get_user_assessment to get their actual data
2. Call get_emission_benchmarks to compare against India/global averages
3. Identify their highest-impact categories
4. Provide specific, quantified recommendations

Always format your responses in clear markdown with headers, bullet points, and bold numbers."""


async def run_agent_loop(
    user_id: int,
    user_message: str,
    conversation_history: list[dict],
    db: Session,
    anthropic_client: anthropic.Anthropic,
) -> tuple[str, list[str]]:
    """
    Run the agentic tool-calling loop.

    The agent continues calling tools until it has enough information
    to generate a complete, grounded response.

    Returns a tuple of:
      - final text response from the agent
      - list of tool names that were called (for frontend display)
    """
    messages = conversation_history + [{"role": "user", "content": user_message}]

    # Track which tools were invoked (for agentic transparency UI)
    tools_called: list[str] = []

    # Agentic loop — continues until Claude stops requesting tools
    max_iterations = 10
    iteration = 0

    while iteration < max_iterations:
        iteration += 1
        logger.info(f"Agent loop iteration {iteration}")

        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=AGENT_TOOLS,
            messages=messages,
        )

        # If Claude finished (no more tool calls), return the text response
        if response.stop_reason == "end_turn":
            text_blocks = [
                block.text
                for block in response.content
                if hasattr(block, "text")
            ]
            return "\n".join(text_blocks), tools_called

        # If Claude wants to use tools
        if response.stop_reason == "tool_use":
            # Add Claude's response (with tool use blocks) to message history
            messages.append({"role": "assistant", "content": response.content})

            # Execute all requested tool calls
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tools_called.append(block.name)
                    result_str = execute_tool(block.name, block.input, db)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result_str,
                    })

            # Add tool results to message history
            messages.append({"role": "user", "content": tool_results})

        else:
            # Unexpected stop reason — return whatever text we have
            text_blocks = [
                block.text
                for block in response.content
                if hasattr(block, "text")
            ]
            return (
                "\n".join(text_blocks) if text_blocks else "I encountered an issue. Please try again.",
                tools_called,
            )

    return "I've reached my analysis limit. Please try a more specific question.", tools_called


async def generate_assessment_recommendations(
    user_id: int,
    db: Session,
    anthropic_client: anthropic.Anthropic,
) -> str:
    """
    Autonomously generate a RecommendationReport after assessment completion.

    The agent will:
    1. Call get_user_assessment
    2. Call get_emission_benchmarks
    3. Optionally call get_progress_history and generate_challenge
    4. Return a structured recommendation report
    """
    prompt = f"""A user (ID: {user_id}) has just completed their carbon footprint assessment.

Please analyze their data and generate a comprehensive RecommendationReport that includes:

1. **Top 3 Reduction Opportunities** — ranked by CO2 impact, with specific kg CO2 savings per month
2. **Contextual Analysis** — how does their footprint compare to India and global averages by category?
3. **3-Month Sustainability Roadmap** — a week-by-week action plan for the next 12 weeks
4. **Personalized Challenge** — suggest one specific eco-challenge based on their highest emission category

Be specific with numbers. Reference their actual data throughout. Make the roadmap achievable and realistic."""

    # generate_assessment_recommendations only needs the text portion
    text, _ = await run_agent_loop(
        user_id=user_id,
        user_message=prompt,
        conversation_history=[],
        db=db,
        anthropic_client=anthropic_client,
    )
    return text
