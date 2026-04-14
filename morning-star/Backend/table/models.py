import uuid
from django.db import models
from accounts.models import CustomUser

class GameSession(models.Model):
    code         = models.CharField(max_length=8, unique=True, editable=False)
    name         = models.CharField(max_length=100)
    master       = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sessions')
    players      = models.ManyToManyField(CustomUser, related_name='joined_sessions', blank=True)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    active_scene = models.ForeignKey(
        'Scene', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} [{self.code}]"


class Scene(models.Model):
    session    = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='scenes')
    name       = models.CharField(max_length=100, default='Нова сцена')
    tokens     = models.JSONField(default=list)
    map_image  = models.ImageField(upload_to='maps/', blank=True, null=True)
    order      = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=False)  # чи бачать гравці цю сцену
    created_at = models.DateTimeField(auto_now_add=True)
    grid_enabled = models.BooleanField(default=False)
    grid_snap    = models.BooleanField(default=False)
    grid_type    = models.CharField(
        max_length=10,
        choices=[('square', 'Square'), ('hex', 'Hex')],
        default='square'
    )
    grid_size    = models.IntegerField(default=60)
    grid_color   = models.CharField(max_length=30, default='rgba(255,255,255,0.15)')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.session.name} — {self.name}"