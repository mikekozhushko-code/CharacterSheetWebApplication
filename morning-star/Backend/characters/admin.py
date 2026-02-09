from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import CustomUser   # твій кастомний юзер
from characters.models import Character  # персонажі

class CharacterInline(admin.TabularInline):
    model = Character
    extra = 0

class CustomUserAdmin(UserAdmin):
    inlines = [CharacterInline]

    def character_count(self, obj):
        return obj.character.count()
    character_count.short_description = "Character"

    list_display = UserAdmin.list_display + ("character_count",)

admin.site.register(CustomUser, CustomUserAdmin)
