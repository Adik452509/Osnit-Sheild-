import spacy

nlp = spacy.load("en_core_web_sm")


def extract_entities(text: str):
    doc = nlp(text)

    persons = []
    organizations = []
    locations = []

    for ent in doc.ents:
        if ent.label_ == "PERSON":
            persons.append(ent.text)
        elif ent.label_ == "ORG":
            organizations.append(ent.text)
        elif ent.label_ in ["GPE", "LOC"]:
            locations.append(ent.text)

    return {
        "persons": list(set(persons)),
        "organizations": list(set(organizations)),
        "locations": list(set(locations))
    }
