from django.apps import AppConfig


class ReturnedBooksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name               = "returned_books"
    verbose_name       = "Returned Books"