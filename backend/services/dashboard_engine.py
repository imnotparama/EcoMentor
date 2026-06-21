"""
Dashboard calculation and badge computation engine for EcoMentor AI.
"""

def compute_badges(
    sustainability_score: float,
    completed_challenges: int,
    total_assessments: int,
    progress_entries: list,
) -> list[str]:
    """Compute earned badges based on user activity."""
    badges = []

    if total_assessments >= 1:
        badges.append("First Assessment")

    if sustainability_score >= 75:
        badges.append("Platinum Eco Warrior")
    elif sustainability_score >= 60:
        badges.append("Gold Contributor")
    elif sustainability_score >= 45:
        badges.append("Silver Steward")
    elif sustainability_score >= 25:
        badges.append("Bronze Beginner")

    if completed_challenges >= 1:
        badges.append("Challenge Accepted")
    if completed_challenges >= 5:
        badges.append("5 Challenges Completed")
    if completed_challenges >= 10:
        badges.append("Eco Champion")

    # Check for 30% reduction
    if len(progress_entries) >= 2:
        first = progress_entries[-1].total_monthly
        latest = progress_entries[0].total_monthly
        if first > 0 and (first - latest) / first >= 0.3:
            badges.append("30% Reducer")

    return badges
