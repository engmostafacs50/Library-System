from django.contrib import admin
from .models import Book

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'author', 'genre', 'status']
    list_filter   = ['genre', 'status']
    search_fields = ['title', 'author']