# tests/db/test_recipe.py
import pytest
from scavenger.db.models.recipe import Recipe


def test_recipe_model():
    """Recipe has required fields."""
    recipe = Recipe(
        recipe_name="LITHO_STEP1_EXP",
        process_type="litho",
        parameters={
            "exposure_dose_mj": 25.0,
            "focus_offset_nm": 0,
            "na": 0.93,
        },
        description="Standard lithography exposure step",
        is_golden=True,
    )
    assert recipe.recipe_name == "LITHO_STEP1_EXP"
    assert recipe.parameters["exposure_dose_mj"] == 25.0
    assert recipe.is_golden is True
