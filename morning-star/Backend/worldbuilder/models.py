from django.db import models
from django.conf import settings


class World(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worlds",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(
        upload_to="worldbuilder/covers/", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Folder(models.Model):
    world = models.ForeignKey(
        World, on_delete=models.CASCADE, related_name="folders"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="children",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Card(models.Model):
    class CardType(models.TextChoices):
        CHARACTER = "character", "Персонаж"
        LOCATION  = "location",  "Локація"
        MAP       = "map",       "Карта"
        CREATURE  = "creature",  "Істота"
        WEAPON    = "weapon",    "Зброя"
        ITEM      = "item",      "Предмет"
        FACTION   = "faction",   "Фракція"
        EVENT     = "event",     "Подія"
        OTHER     = "other",     "Інше"

    world = models.ForeignKey(
        World, on_delete=models.CASCADE, related_name="cards"
    )
    folder = models.ForeignKey(
        Folder,
        on_delete=models.SET_NULL,
        related_name="cards",
        blank=True,
        null=True,
    )
    card_type = models.CharField(
        max_length=20, choices=CardType.choices, default=CardType.OTHER
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to="worldbuilder/cards/", blank=True, null=True
    )
    order = models.PositiveIntegerField(default=0)
    is_visible_in_wiki = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_card_type_display()})"


class CardBlock(models.Model):
    """Блок вмісту всередині карточки з власною видимістю у вікі."""

    card = models.ForeignKey(
        Card,
        on_delete=models.CASCADE,
        related_name="blocks",
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    is_visible_in_wiki = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.card.name} — {self.title}"


class DnDSheet(models.Model):
    card = models.OneToOneField(
        Card,
        on_delete=models.CASCADE,
        related_name="dnd_sheet",
        limit_choices_to={"card_type": Card.CardType.CHARACTER},
    )
    character_class = models.CharField(max_length=100, blank=True)
    subclass = models.CharField(max_length=100, blank=True)
    race = models.CharField(max_length=100, blank=True)
    background = models.CharField(max_length=100, blank=True)
    alignment = models.CharField(max_length=50, blank=True)
    experience_points = models.PositiveIntegerField(default=0)
    level = models.PositiveSmallIntegerField(default=1)
    strength = models.PositiveSmallIntegerField(default=10)
    dexterity = models.PositiveSmallIntegerField(default=10)
    constitution = models.PositiveSmallIntegerField(default=10)
    intelligence = models.PositiveSmallIntegerField(default=10)
    wisdom = models.PositiveSmallIntegerField(default=10)
    charisma = models.PositiveSmallIntegerField(default=10)
    max_hp = models.PositiveSmallIntegerField(default=0)
    current_hp = models.SmallIntegerField(default=0)
    temporary_hp = models.PositiveSmallIntegerField(default=0)
    armor_class = models.PositiveSmallIntegerField(default=10)
    initiative = models.SmallIntegerField(default=0)
    speed = models.PositiveSmallIntegerField(default=30)
    hit_dice = models.CharField(max_length=20, blank=True)
    saving_throws = models.JSONField(default=dict, blank=True)
    skills = models.JSONField(default=dict, blank=True)
    equipment = models.TextField(blank=True)
    features_and_traits = models.TextField(blank=True)
    other_proficiencies = models.TextField(blank=True)
    languages = models.TextField(blank=True)
    spellcasting_ability = models.CharField(max_length=20, blank=True)
    spell_save_dc = models.PositiveSmallIntegerField(default=0)
    spell_attack_bonus = models.SmallIntegerField(default=0)
    spells = models.JSONField(default=dict, blank=True)
    personality_traits = models.TextField(blank=True)
    ideals = models.TextField(blank=True)
    bonds = models.TextField(blank=True)
    flaws = models.TextField(blank=True)
    backstory = models.TextField(blank=True)

    def __str__(self):
        return f"DnD Sheet — {self.card.name}"


class WikiSettings(models.Model):
    game_session = models.OneToOneField(
        "table.GameSession",
        on_delete=models.CASCADE,
        related_name="wiki_settings",
    )
    world = models.ForeignKey(
        World,
        on_delete=models.SET_NULL,
        related_name="wiki_settings",
        blank=True,
        null=True,
    )
    is_enabled = models.BooleanField(default=False)
    visible_folders = models.ManyToManyField(
        Folder, blank=True, related_name="wiki_settings"
    )
    visible_cards = models.ManyToManyField(
        Card, blank=True, related_name="wiki_settings"
    )

    def __str__(self):
        return f"Wiki for {self.game_session}"