from django.apps import AppConfig


class WorldbuilderConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "worldbuilder"
    verbose_name = "World Builder"

    def ready(self):
        import worldbuilder.signals  # noqa: F401