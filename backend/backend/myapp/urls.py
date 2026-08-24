from django.urls import path

from myapp.views import EnfantViewSet, MyTokenObtainPairView, MyTokenRefreshView, ParentViewSet, RegisterView, LogoutView, UserProfileView , carnetViewSet , PaiementViewSet, CarnetDetailViewSet
urlpatterns = [
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/user/profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/enfants/', EnfantViewSet.as_view({'get': 'list', 'post': 'create' }), name='enfant-list'),
    path('api/parents/', ParentViewSet.as_view({'get': 'list', 'post': 'create'}), name='parent-list'),
    path('api/parents/<int:pk>/', ParentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='parent-detail'),
    path('api/parents/<int:pk>/add-enfant/', ParentViewSet.as_view({'post': 'add_enfant'}), name='parent-add-enfant'),
    path('api/parents/<int:pk>/remove-enfant/', ParentViewSet.as_view({'post': 'remove_enfant'}), name='parent-remove-enfant'),
    path('api/enfants/<int:pk>/', EnfantViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='enfant-detail'),
    path('api/carnets/', carnetViewSet.as_view({'get': 'list', 'post': 'create'}), name='carnet-list'),
    path('api/carnets/<int:pk>/', carnetViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='carnet-detail'),
    path('api/carnets/<int:pk>/paiement/<int:paiement_pk>/update-status-montant/', PaiementViewSet.as_view({'put': 'update_status_montant'}), name='paiement-update-status-montant'),
    path('api/carnets/<int:pk>/detail/', CarnetDetailViewSet.as_view({'get': 'retrieve'}), name='carnet-detail'),
    path('api/carnets/<int:pk>/paiement/<int:paiement_pk>/', PaiementViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='paiement-detail'),
]