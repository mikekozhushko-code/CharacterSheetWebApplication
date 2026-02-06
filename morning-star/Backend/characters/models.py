from django.db import models
from django.conf import settings
import math

def default_wallet():
    return {"pp": 0, "gp": 0, "sp": 0, "cp": 0}

# Create your models here.
class Character(models.Model):
    # Base Info
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="character"
    )
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    race = models.CharField(max_length=50, blank=True, null=True)
    class_type = models.CharField(max_length=50, blank=True, null=True)
    level = models.PositiveIntegerField(default=1)

    # Stats
    str = models.IntegerField(default=10)
    dex = models.IntegerField(default=10)
    con = models.IntegerField(default=10)
    int = models.IntegerField(default=10)
    wis = models.IntegerField(default=10)
    chr = models.IntegerField(default=10)

    # Save Bonus
    str_save = models.IntegerField(default=0)
    dex_save = models.IntegerField(default=0)
    con_save = models.IntegerField(default=0)
    int_save = models.IntegerField(default=0)
    wis_save = models.IntegerField(default=0)
    chr_save = models.IntegerField(default=0)

    # Battle Stats
    ac = models.IntegerField(default=10)
    speed = models.IntegerField(default=30)
    prof = models.IntegerField(default=2)
    proficiencies = models.JSONField(default=list)

    # HP
    hp_current = models.PositiveIntegerField(default=10)
    hp_max = models.PositiveIntegerField(default=10)

    # Another
    initiative = models.PositiveIntegerField(default=0)
    inspiration = models.PositiveIntegerField(default=0) 
    exhaustion = models.PositiveIntegerField(default=0)

    # XP
    xp = models.PositiveIntegerField(default=0)
    max_xp = models.PositiveIntegerField(default=300)

    # Coins
    wallet = models.JSONField(default=default_wallet)


    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.owner.username})"
