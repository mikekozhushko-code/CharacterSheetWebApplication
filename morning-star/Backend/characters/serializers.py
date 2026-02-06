from rest_framework import serializers
from math import floor
from .models import Character

class CharacterSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    char = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()

    class Meta:
        model = Character
        # fields = [
        #     "id", 
        #     "name", 
        #     "race", 
        #     "class_type", 
        #     "level", 
        #     "stats",
        #     "char",
        #     "str",
        # ]
        exclude = ["owner", "created_at", "update_at"]

    def get_modifier(self, value: int) -> int:
        return floor((value - 10) // 2)

    def get_skills(self, obj):
        skills = [
            {"id": "str", "n": "Athletics", "v": self.get_modifier(obj.str)},
            
            {"id": "dex", "n": "Acrobatics", "v": self.get_modifier(obj.dex)},
            {"id": "dex", "n": "Sleight of Hand", "v": self.get_modifier(obj.dex)},
            {"id": "dex", "n": "Stealth", "v": self.get_modifier(obj.dex)},
            
            {"id": "int", "n": "Arcana", "v": self.get_modifier(obj.int)},
            {"id": "int", "n": "History", "v": self.get_modifier(obj.int)},
            {"id": "int", "n": "Investigation", "v": self.get_modifier(obj.int)},
            {"id": "int", "n": "Nature", "v": self.get_modifier(obj.int)},
            {"id": "int", "n": "Religion", "v": self.get_modifier(obj.int)},
            
            {"id": "wis", "n": "Animal Handling", "v": self.get_modifier(obj.wis)},
            {"id": "wis", "n": "Insight", "v": self.get_modifier(obj.wis)},
            {"id": "wis", "n": "Medicine", "v": self.get_modifier(obj.wis)},
            {"id": "wis", "n": "Perception", "v": self.get_modifier(obj.wis)},
            {"id": "wis", "n": "Survival", "v": self.get_modifier(obj.wis)},
            
            {"id": "chr", "n": "Deception", "v": self.get_modifier(obj.chr)},
            {"id": "chr", "n": "Intimidation", "v": self.get_modifier(obj.chr)},
            {"id": "chr", "n": "Performance", "v": self.get_modifier(obj.chr)},
            {"id": "chr", "n": "Persuasion", "v": self.get_modifier(obj.chr)},
        ]

        result = []

        for skill in skills:
            proof = skill["n"] in obj.proficiencies
            value = skill["v"] + (obj.prof if proof else 0)
            result.append({
                "id": skill["id"],
                "n": skill["n"],
                "v": value,
                "proof": proof
            })

        return result

    def get_stats(self, obj):
        return [
            {
                "id": "str",
                "name": "Strength",
                "val": obj.str,
                "save": obj.str_save,
                "mod": self.get_modifier(obj.str),
            },
            {
                "id": "dex",
                "name": "Dexterity",
                "val": obj.dex,
                "save": obj.dex_save,
                "mod": self.get_modifier(obj.dex),
            },
            {
                "id": "con",
                "name": "Constitution",
                "val": obj.con,
                "save": obj.con_save,
                "mod": self.get_modifier(obj.con),
            },
            {
                "id": "int",
                "name": "Intelligence",
                "val": obj.int,
                "save": obj.int_save,
                "mod": self.get_modifier(obj.int),
            },
            {
                "id": "wis",
                "name": "Wisdom",
                "val": obj.wis,
                "save": obj.wis_save,
                "mod": self.get_modifier(obj.wis),
            },
            {
                "id": "chr",
                "name": "Charisma",
                "val": obj.chr,
                "save": obj.chr_save,
                "mod": self.get_modifier(obj.chr),
            },
        ]

    def get_char(self, obj):
        return {
            "ac": obj.ac, 
            "speed": obj.speed, 
            "prof": obj.prof, 
            "wallet": obj.wallet, 
            "hpCurrent": obj.hp_current, 
            "hpMax": obj.hp_max, 
            "initiative": obj.initiative, 
            "inspiration": obj.inspiration, 
            "exhaustion": obj.exhaustion, 
            "xp": obj.xp, 
            "maxXp": obj.max_xp, 
            "level": obj.level,
        }
