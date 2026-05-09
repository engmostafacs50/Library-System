from django.db import models

class Book(models.Model):
    GENRE_CHOICES = [
        ('Programming', 'Programming'),
        ('Fiction',     'Fiction'),
        ('Sci-Fi',      'Sci-Fi'),
        ('Science',     'Science'),
        ('History',     'History'),
        ('Other',       'Other'),
    ]
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('borrowed',  'Borrowed'),
    ]
    title       = models.CharField(max_length=200)
    author      = models.CharField(max_length=100)
    genre       = models.CharField(max_length=100, choices=GENRE_CHOICES, default='Other')
    description = models.TextField(blank=True, default='')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    image       = models.TextField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title