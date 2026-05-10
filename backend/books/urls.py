from django.urls import path
from .views import BookListCreateView, BookDetailView, BookByGenreView

urlpatterns = [
    path('', BookListCreateView.as_view(), name='book-list-create'),
    path('<int:pk>/', BookDetailView.as_view(), name='book-detail'),
    path('genre/<str:genre>/', BookByGenreView.as_view(), name='book-by-genre'),
]

from rest_framework import generics, filters
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated
from .models import Book
from .serializers import BookSerializer

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff

class BookListCreateView(generics.ListCreateAPIView):
    queryset           = Book.objects.all()
    serializer_class   = BookSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['title', 'author', 'genre']

class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Book.objects.all()
    serializer_class   = BookSerializer
    permission_classes = [IsAdminOrReadOnly]

class BookByGenreView(generics.ListAPIView):
    serializer_class   = BookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        genre = self.kwargs['genre']
        return Book.objects.filter(genre__iexact=genre)