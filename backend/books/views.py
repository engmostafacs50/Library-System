from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, BasePermission, SAFE_METHODS, IsAuthenticated
from rest_framework.response import Response
from .models import Book
from .serializers import BookSerializer
from users.authentication import CookieJWTAuthentication

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )

class BookListCreateView(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "author", "genre"]


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAdminOrReadOnly]


class BookByGenreView(generics.ListAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        genre = self.kwargs["genre"]
        return Book.objects.filter(genre__iexact=genre)


MAX_IMAGE_BYTES = 5 * 1024 * 1024 
MAX_IMAGE_B64_CHARS = 4 * ((MAX_IMAGE_BYTES + 2) // 3)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_book(request):

    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {"detail": "You do not have permission to add books."},
            status=status.HTTP_403_FORBIDDEN,
        )

    data = request.data

    errors = {}

    title = (data.get("title") or "").strip()
    if not title:
        errors["title"] = ["This field is required."]

    author = (data.get("author") or "").strip()
    if not author:
        errors["author"] = ["This field is required."]

    genre = (data.get("genre") or "Other").strip()

    book_status = (data.get("status") or "available").strip()

    description = (data.get("description") or "").strip()

    image = data.get("image") or None
    if image is not None:
        if not isinstance(image, str):
            errors["image"] = ["Image must be a base64 data-URL string."]
        elif not image.startswith("data:image/"):
            errors["image"] = [
                "Image must be a valid data-URL (e.g. data:image/png;base64,…)."
            ]
        elif len(image) > MAX_IMAGE_B64_CHARS:
            errors["image"] = ["Image must be under 5 MB."]

    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    book = Book.objects.create(
        title=title,
        author=author,
        genre=genre,
        status=book_status,
        description=description,
        image=image,
    )

    serializer = BookSerializer(book, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)