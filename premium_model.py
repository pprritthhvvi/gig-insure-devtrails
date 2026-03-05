def calculate_weekly_premium(base=50, zone_risk=0, disruption_factor=0):
    """
    Calculate weekly premium for gig workers.
    Parameters:
    base (int): default premium (₹50/week)
    zone_risk (int): additional risk factor (₹ per week)
    disruption_factor (int): extra premium adjustment based on disruptions
    Returns:
    int: total weekly premium
    """
    return base + zone_risk + disruption_factor
if __name__ == "__main__":
    # Worker in a flood-prone zone (+₹10) with disruption forecast (+₹5)
    premium = calculate_weekly_premium(base=50, zone_risk=10, disruption_factor=5)
    print("Weekly Premium:", premium)
