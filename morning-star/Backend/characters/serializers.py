from rest_framework import serializers
from math import floor
from .models import Character

class CharacterSerializer(serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    char = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = [
            "id", 
            "name", 
            "race", 
            "class_type", 
            "level", 
            "stats",
            "char",
        ]

    def get_modifier(self, value: int) -> int:
        return floor((value - 10) // 2)

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
