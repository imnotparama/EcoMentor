"""
Challenge generation engine for EcoMentor AI.

Challenges are mapped to emission categories and generated based on
the user's highest-impact area.
"""

import random
from typing import Optional

CHALLENGE_TEMPLATES: dict[str, list[dict]] = {
    "transport": [
        {
            "title": "No-Car Friday",
            "description": (
                "For every Friday this week, ditch the car and use public transport, "
                "cycle, or walk. Track the distance you travel car-free."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 8.4,
            "tips": [
                "Plan your route the night before",
                "Use Google Maps in transit mode",
                "Bring a reusable water bottle for the commute",
            ],
        },
        {
            "title": "Cycle-to-Work Week",
            "description": (
                "Cycle to work (or to your nearest transit hub) for 5 consecutive days. "
                "Even partial cycling combined with transit counts!"
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 15.0,
            "tips": [
                "Check for city bike-sharing programs",
                "Keep a change of clothes at work",
                "Start with shorter distances and build up",
            ],
        },
        {
            "title": "Public Transport Only Weekend",
            "description": (
                "For an entire weekend, use only public transport, walking, or cycling. "
                "No personal vehicle usage at all."
            ),
            "duration_days": 2,
            "estimated_co2_saving_kg": 5.0,
            "tips": [
                "Download your city's transit app",
                "Plan trips in advance using Google Maps",
                "Enjoy the journey — bring a book or podcast",
            ],
        },
        {
            "title": "Carpooling Champion",
            "description": (
                "Organize or join a carpool for your daily commute for one full week. "
                "Share your ride with at least one other person every day."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 12.0,
            "tips": [
                "Use apps like Quick Ride or BlaBlaCar",
                "Coordinate with colleagues who live nearby",
                "Establish a regular pickup schedule",
            ],
        },
    ],
    "energy": [
        {
            "title": "AC-Free Morning Challenge",
            "description": (
                "Avoid using AC before 10 AM every day for one week. "
                "Open windows, use fans, or step outside instead."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 10.5,
            "tips": [
                "Set your AC thermostat to 24°C when you do use it",
                "Use ceiling fans — they use 90% less energy than AC",
                "Thermal curtains dramatically reduce heat gain",
            ],
        },
        {
            "title": "Unplug Standby Devices Week",
            "description": (
                "Unplug all devices on standby (TV, chargers, set-top boxes) "
                "when not in use for one full week."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 4.2,
            "tips": [
                "Use smart power strips to cut standby power",
                "Phone chargers use power even when not charging",
                "Set-top boxes are often the biggest standby culprits",
            ],
        },
        {
            "title": "LED Switch Week",
            "description": (
                "Replace at least 3 incandescent or CFL bulbs in your home "
                "with LED alternatives this week."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 6.0,
            "tips": [
                "LED bulbs use 75% less energy than incandescents",
                "Look for 4-star BEE rated LEDs",
                "The savings pay back the cost in 3-6 months",
            ],
        },
        {
            "title": "Solar Cooking Sunday",
            "description": (
                "Cook at least one meal using a solar cooker, or reduce cooking "
                "energy by using a pressure cooker for 5 meals this week."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 3.5,
            "tips": [
                "Pressure cookers reduce cooking time by 70%",
                "Soak lentils and beans before cooking to reduce time",
                "Plan batch cooking to minimize stove usage",
            ],
        },
    ],
    "food": [
        {
            "title": "Plant-Based Monday",
            "description": (
                "Go completely plant-based every Monday for the next 4 weeks. "
                "No meat, poultry, or seafood on Mondays."
            ),
            "duration_days": 28,
            "estimated_co2_saving_kg": 14.4,
            "tips": [
                "Try dal, rajma, or chana as protein sources",
                "Paneer and tofu are great meat substitutes",
                "South Indian cuisine is naturally plant-rich",
            ],
        },
        {
            "title": "Zero Food Waste Week",
            "description": (
                "For one week, plan your meals to use everything you buy. "
                "Nothing goes into the bin — leftovers become tomorrow's lunch."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 8.0,
            "tips": [
                "Plan meals before shopping — buy only what you need",
                "Store produce properly to extend shelf life",
                "Vegetable scraps can make flavorful stock",
            ],
        },
        {
            "title": "Local Market Challenge",
            "description": (
                "Buy all your vegetables and fruits from a local market or "
                "directly from farmers for two weeks — no supermarket produce."
            ),
            "duration_days": 14,
            "estimated_co2_saving_kg": 5.5,
            "tips": [
                "Local produce travels less = lower food miles",
                "Markets often have fresher, seasonal produce",
                "Bring your own bags and containers",
            ],
        },
    ],
    "shopping": [
        {
            "title": "No New Purchases Week",
            "description": (
                "Commit to buying absolutely nothing new (non-essential) for one week. "
                "If you need something, borrow, rent, or buy second-hand."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 20.0,
            "tips": [
                "Uninstall or mute shopping apps temporarily",
                "Use a 24-hour rule before any purchase",
                "Try OLX or Facebook Marketplace for second-hand items",
            ],
        },
        {
            "title": "Second-Hand Only Challenge",
            "description": (
                "For two weeks, if you must buy clothing or household items, "
                "only source them second-hand or through clothing swaps."
            ),
            "duration_days": 14,
            "estimated_co2_saving_kg": 30.0,
            "tips": [
                "Check Thrift + Store, Reloveclothing, or local thrift shops",
                "Organize a clothing swap with friends or community",
                "Repair and alter existing clothes before replacing them",
            ],
        },
        {
            "title": "Packaging-Free Week",
            "description": (
                "Avoid buying anything packaged in single-use plastic for 7 days. "
                "Use refill stores, bulk bins, or package-free alternatives."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 3.5,
            "tips": [
                "Bring your own containers to bulk stores",
                "Choose glass or metal packaging when plastic isn't avoidable",
                "Many Indian kiranas will sell loose goods",
            ],
        },
    ],
    "waste": [
        {
            "title": "Zero Plastic Weekend",
            "description": (
                "For one full weekend, refuse all single-use plastics — bags, "
                "straws, cups, and packaging. Carry your own alternatives."
            ),
            "duration_days": 2,
            "estimated_co2_saving_kg": 1.5,
            "tips": [
                "Carry a reusable bag, bottle, and cutlery kit",
                "Say no to straws at restaurants",
                "Choose restaurants that don't use single-use plastics",
            ],
        },
        {
            "title": "Composting Starter Week",
            "description": (
                "Set up a basic compost bin or use municipal composting for "
                "all your kitchen wet waste for one week."
            ),
            "duration_days": 7,
            "estimated_co2_saving_kg": 6.0,
            "tips": [
                "A simple clay pot with drainage holes works as a compost bin",
                "Layer wet (food scraps) and dry (paper, dry leaves) waste",
                "Many BMC/BBMP wards have composting pick-up services",
            ],
        },
        {
            "title": "Recycling Deep Dive",
            "description": (
                "Sort and properly recycle all recyclable waste for two weeks. "
                "Learn what's accepted by your local recycler and act on it."
            ),
            "duration_days": 14,
            "estimated_co2_saving_kg": 8.5,
            "tips": [
                "Clean containers before recycling — dirty plastic often isn't recycled",
                "Use Kabadiwala or Scrap Uncle for pick-up",
                "Paper, cardboard, glass, and metal are almost always recyclable",
            ],
        },
    ],
}


def generate_challenge_for_category(category: str, exclude_titles: Optional[list[str]] = None) -> dict:
    """
    Generate a random challenge from the given category.
    Returns challenge data as a dictionary.
    """
    if category not in CHALLENGE_TEMPLATES:
        # Default to energy if category not found
        category = "energy"

    templates = CHALLENGE_TEMPLATES[category]
    if exclude_titles:
        filtered = [t for t in templates if t["title"] not in exclude_titles]
        if filtered:
            templates = filtered

    challenge = random.choice(templates)
    return {**challenge, "category": category}


def get_all_categories() -> list[str]:
    """Return all available challenge categories."""
    return list(CHALLENGE_TEMPLATES.keys())


def get_challenges_for_category(category: str) -> list[dict]:
    """Return all challenges for a given category."""
    return CHALLENGE_TEMPLATES.get(category, [])
