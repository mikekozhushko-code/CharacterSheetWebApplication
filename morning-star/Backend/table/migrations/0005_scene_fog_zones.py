from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('table', '0004_alter_scene_grid_color'),
    ]

    operations = [
        migrations.AddField(
            model_name='scene',
            name='fog_zones',
            field=models.JSONField(default=list),
        ),
    ]
