from django.urls import path
from .views import (
    CreateSessionView, JoinSessionView, SessionDetailView,
    SceneListCreateView, SceneDetailView, MySessionsView
)

urlpatterns = [
    path('table/create/',                           CreateSessionView.as_view(),   name='table_create'),
    path('table/join/',                             JoinSessionView.as_view(),     name='table_join'),
    path('table/my/',                               MySessionsView.as_view(),      name='my_sessions'),
    path('table/my/<int:pk>/',                      MySessionsView.as_view(),      name='delete_session'),
    path('table/<str:code>/',                       SessionDetailView.as_view(),   name='table_detail'),
    path('table/<str:code>/scenes/',                SceneListCreateView.as_view(), name='scene_list_create'),
    path('table/<str:code>/scenes/<int:scene_id>/', SceneDetailView.as_view(),     name='scene_detail'),
]