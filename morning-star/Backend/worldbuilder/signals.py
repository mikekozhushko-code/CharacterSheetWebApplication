from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Card, DnDSheet


@receiver(post_save, sender=Card)
def create_or_delete_dnd_sheet(sender, instance, created, **kwargs):
    """
    Якщо карточка має тип 'character' — створюємо пустий DnDSheet.
    Якщо тип змінився на інший — видаляємо існуючий sheet.
    """
    if instance.card_type == Card.CardType.CHARACTER:
        DnDSheet.objects.get_or_create(card=instance)
    else:
        DnDSheet.objects.filter(card=instance).delete()