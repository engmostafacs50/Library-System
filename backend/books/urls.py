from django.urls import path
from .views import BookListCreateView, BookDetailView, BookByGenreView

urlpatterns = [
    path('',                       BookListCreateView.as_view()),
    path('<int:pk>/',              BookDetailView.as_view()),
    path('genre/<str:genre>/',     BookByGenreView.as_view()),
]