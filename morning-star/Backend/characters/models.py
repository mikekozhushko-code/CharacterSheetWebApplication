from django.db import models
from django.conf import settings

# Create your models here.
class Character(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="character"
    )
    name = models.CharField(max_length=100, blank=True, null=True)
    race = models.CharField(max_length=50, blank=True, null=True)
    class_type = models.CharField(max_length=50, blank=True, null=True)
    level = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.owner.username})"
