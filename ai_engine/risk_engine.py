# ai_engine/risk_engine.py


def calculate_severity(incident_type):

    mapping = {
        "cyber_attack": 3,
        "border_tension": 3,
        "military_activity": 2,
        "civil_unrest": 2,
        "other": 1
    }

    return mapping.get(incident_type, 1)


def calculate_risk_score(severity_level, location_count):

    base = severity_level * 0.3
    geo_factor = min(location_count * 0.05, 0.2)

    risk = base + geo_factor

    return round(min(risk, 1.0), 3)
