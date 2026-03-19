import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  FileText, Users, Eye, AlertTriangle, 
  Trash2, XCircle, CheckCircle, BarChart3 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const { token } = useAuth();
  const { t, isHindi } = useLanguage();
  
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, articleId: null });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setStats(statsRes.data);

      // Fetch articles
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const articlesRes = await axios.get(`${API}/admin/articles`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setArticles(articlesRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error(isHindi ? 'डेटा लोड करने में त्रुटि' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!actionDialog.articleId) return;
    
    try {
      await axios.put(`${API}/admin/articles/${actionDialog.articleId}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success(t('articleRevoked'));
      fetchData();
    } catch (error) {
      console.error('Error revoking article:', error);
      toast.error(isHindi ? 'रद्द करने में त्रुटि' : 'Error revoking article');
    } finally {
      setActionDialog({ open: false, type: null, articleId: null });
    }
  };

  const handleDelete = async () => {
    if (!actionDialog.articleId) return;
    
    try {
      await axios.delete(`${API}/articles/${actionDialog.articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success(t('articleDeleted'));
      fetchData();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(isHindi ? 'हटाने में त्रुटि' : 'Error deleting article');
    } finally {
      setActionDialog({ open: false, type: null, articleId: null });
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="status-published flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {isHindi ? 'प्रकाशित' : 'Published'}</span>;
      case 'draft':
        return <span className="status-draft">{isHindi ? 'ड्राफ्ट' : 'Draft'}</span>;
      case 'revoked':
        return <span className="status-revoked flex items-center gap-1"><XCircle className="w-3 h-3" /> {isHindi ? 'रद्द' : 'Revoked'}</span>;
      default:
        return <span className="status-draft">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold text-[#2a5a5a] ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
            {t('admin')} {isHindi ? 'डैशबोर्ड' : 'Dashboard'}
          </h1>
          <p className={`text-gray-600 mt-1 ${isHindi ? 'font-hindi' : ''}`}>
            {isHindi ? 'सभी लेख और उपयोगकर्ता प्रबंधित करें' : 'Manage all articles and users'}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="stat-card" data-testid="admin-stat-total">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2a5a5a]/10 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#2a5a5a]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{isHindi ? 'कुल लेख' : 'Total'}</p>
                  <p className="text-xl font-bold text-[#2a5a5a]">{stats.total_articles}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('published')}</p>
                  <p className="text-xl font-bold text-green-600">{stats.published}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('drafts')}</p>
                  <p className="text-xl font-bold text-amber-600">{stats.drafts}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{isHindi ? 'रद्द' : 'Revoked'}</p>
                  <p className="text-xl font-bold text-red-600">{stats.revoked}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{isHindi ? 'कुल उपयोगकर्ता' : 'Total Users'}</p>
                  <p className="text-xl font-bold text-blue-600">{stats.total_users}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{isHindi ? 'रिपोर्टर' : 'Reporters'}</p>
                  <p className="text-xl font-bold text-purple-600">{stats.reporters}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['all', 'published', 'draft', 'revoked'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
                filter === f 
                  ? 'text-[#2a5a5a] border-b-2 border-[#2a5a5a]' 
                  : 'text-gray-500 hover:text-[#2a5a5a]'
              }`}
              data-testid={`admin-filter-${f}`}
            >
              {f === 'all' ? (isHindi ? 'सभी' : 'All') : 
               f === 'revoked' ? (isHindi ? 'रद्द' : 'Revoked') :
               t(f === 'published' ? 'published' : 'drafts')}
            </button>
          ))}
        </div>

        {/* Articles Table */}
        <div className="bg-white border border-gray-200 overflow-hidden overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className={`text-gray-500 ${isHindi ? 'font-hindi' : ''}`}>
                {isHindi ? 'कोई लेख नहीं मिला' : 'No articles found'}
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('title')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('author')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('category')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('status')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('views')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{isHindi ? 'तारीख' : 'Date'}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.article_id} data-testid={`admin-article-row-${article.article_id}`}>
                    <td>
                      <div className="max-w-xs">
                        <Link 
                          to={`/article/${article.article_id}`}
                          className={`font-semibold text-gray-900 line-clamp-1 hover:text-[#2a5a5a] ${isHindi ? 'font-hindi' : ''}`}
                        >
                          {isHindi && article.title_hi ? article.title_hi : article.title}
                        </Link>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{article.author_name}</td>
                    <td>
                      <span className={`category-pill ${isHindi ? 'font-hindi' : ''}`}>
                        {t(article.category.toLowerCase())}
                      </span>
                    </td>
                    <td>{getStatusBadge(article.status)}</td>
                    <td>{article.views || 0}</td>
                    <td className="text-sm text-gray-500 whitespace-nowrap">{formatDate(article.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/article/${article.article_id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2a5a5a]">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {article.status === 'published' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-amber-500 hover:text-amber-600"
                            onClick={() => setActionDialog({ open: true, type: 'revoke', articleId: article.article_id })}
                            data-testid={`revoke-btn-${article.article_id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-red-600"
                          onClick={() => setActionDialog({ open: true, type: 'delete', articleId: article.article_id })}
                          data-testid={`admin-delete-btn-${article.article_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={() => setActionDialog({ open: false, type: null, articleId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={isHindi ? 'font-hindi-heading' : 'font-heading'}>
              {actionDialog.type === 'revoke' 
                ? (isHindi ? 'लेख रद्द करें?' : 'Revoke Article?')
                : (isHindi ? 'लेख हटाएं?' : 'Delete Article?')
              }
            </AlertDialogTitle>
            <AlertDialogDescription className={isHindi ? 'font-hindi' : ''}>
              {actionDialog.type === 'revoke'
                ? (isHindi 
                    ? 'लेख रद्द करने से यह सार्वजनिक दृश्य से हट जाएगा।'
                    : 'Revoking this article will remove it from public view.')
                : (isHindi 
                    ? 'यह क्रिया पूर्ववत नहीं की जा सकती। लेख स्थायी रूप से हटा दिया जाएगा।'
                    : 'This action cannot be undone. The article will be permanently deleted.')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isHindi ? 'font-hindi' : ''}>
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={actionDialog.type === 'revoke' ? handleRevoke : handleDelete}
              className={actionDialog.type === 'revoke' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}
              data-testid="confirm-action-btn"
            >
              {actionDialog.type === 'revoke' 
                ? (isHindi ? 'रद्द करें' : 'Revoke')
                : (isHindi ? 'हटाएं' : 'Delete')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
