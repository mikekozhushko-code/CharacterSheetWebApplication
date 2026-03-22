import uuid
from django.db import models
from accounts.models import CustomUser

class GameSession(models.Model):
    code        = models.CharField(max_length=8, unique=True, editable=False)
    name        = models.CharField(max_length=100)
    master      = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sessions')
    players     = models.ManyToManyField(CustomUser, related_name='joined_sessions', blank=True)
    map_image   = models.ImageField(upload_to='maps/', blank=True, null=True)
    tokens      = models.JSONField(default=list)   # позиції токенів
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Generate unique 8-char session code on first save
        if not self.code:
            self.code = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} [{self.code}]"