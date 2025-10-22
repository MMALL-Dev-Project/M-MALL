import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useNotices } from './useNotices';
import './Notice.css';

const Notice = () => {
    const { nid } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuth();

    //useNotice에서 데이터,함수 가져오기
    const {
        notices,
        fetchNotices,
        createNotice,
        updateNotice,
        deleteNotice
    } = useNotices();

    // 관리자 권한 확인
    const isAdmin = userInfo?.role === 'admin';

    //관리자 폼 상태
    const [adminForm, setAdminForm] = useState({
        title: '',
        content: '',
        is_important: false
    });

    //인라인 편집 상태
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        content: '',
        is_important: false
    });

    //컴포넌트 마운트시 데이터 불러오기
    useEffect(() => {
        fetchNotices();
    }, []);

    //확장된 공지사항 ID 
    const [expandedId, setExpandedId] = useState(null);

    //공지사항 내용 확장/축소
    const toggleExpand = (noticeId) => {
        if (editingId) return;
        setExpandedId(expandedId === noticeId ? null : noticeId);
    }

    //관리자 폼 변경 처리
    const handleAdminFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAdminForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    //공지사항 추가
    const handleAddNotice = async (e) => {
        if (!adminForm.title || !adminForm.content.trim()) {
            alert('제목과 내용을 모두 입력해주세요');
            return;
        }

        const result = await createNotice(adminForm);

        if (result.success) {
            alert('공지사항이 등록되었습니다');
            setAdminForm({ title: '', content: '', is_important: false });
            fetchNotices();
        } else {
            alert(result.error || '등록에 실패했습니다.');
        }
    };

    //인라인 편집
    const startEditing = (notice) => {
        setEditingId(notice.nid);
        setEditForm({
            title: notice.title,
            content: notice.content,
            is_important: notice.is_important
        });
    };

    //인라인 편집 취소
    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ title: '', content: '', is_important: false });
    };

    //편집 폼 변경 처리
    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    //공지사항 수정 저장
    const handleSaveEdit = async () => {
        if (!editForm.title.trim() || !editForm.content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        const result = await updateNotice(editingId, editForm);

        if (result.success) {
            alert('공지사항이 수정되었습니다.');
            setEditingId(null);
            fetchNotices();
        } else {
            alert(result.error || '수정에 실패했습니다.');
        }
    };

    //공지사항 삭제 처리
    const handleDeleteNotice = async (noticeId) => {
        if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
            return;
        }

        const result = await deleteNotice(noticeId);

        if (result.success) {
            alert('공지사항이 삭제되었습니다.');

            if (nid) {
                navigate('/support/notice');
            } else {
                fetchNotices();
            }
        } else {
            alert(result.error || '삭제에 실패했습니다.');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    return (
        <div id="notice-container" className="notice-container">
            <div id="notice-wrapper" className="notice-wrapper">
                <div id="notice-list" className="notice-list">
                    <div id="notice-header" className="notice-header">
                        <h2>공지사항</h2>
                        <p>M-MALL의 새로운 소식과 중요한 공지사항을 확인하세요.</p>
                    </div>

                    {/* 관리자 글 작성 폼 */}
                    {isAdmin && (
                        <div id="notice-admin-write-form" className="admin-write-form">
                            <div id="notice-form-header" className="form-header">
                                <h3>📝 공지사항 작성</h3>
                            </div>
                            <div id="notice-form-body" className="form-body">
                                <div id="notice-form-row-title" className="form-row">
                                    <input
                                        type="text"
                                        name="title"
                                        value={adminForm.title}
                                        onChange={handleAdminFormChange}
                                        placeholder="공지사항 제목을 입력하세요"
                                        id="notice-title-input"
                                        className="title-input"
                                    />
                                </div>
                                <div id="notice-form-row-content" className="form-row">
                                    <textarea
                                        name="content"
                                        value={adminForm.content}
                                        onChange={handleAdminFormChange}
                                        placeholder="공지사항 내용을 입력하세요"
                                        id="notice-content-input"
                                        className="content-input"
                                        rows="3"
                                    />
                                </div>
                                <div id="notice-form-actions" className="form-row form-actions">
                                    <label id="notice-checkbox-label" className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="is_important"
                                            checked={adminForm.is_important}
                                            onChange={handleAdminFormChange}
                                            id="notice-important-checkbox"
                                        />
                                        중요 공지사항
                                    </label>
                                    <button
                                        type="button"
                                        id="notice-add-btn"
                                        className="add-btn"
                                        onClick={handleAddNotice}
                                        disabled={!adminForm.title.trim() || !adminForm.content.trim()}
                                    >
                                        등록
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div id="notice-content-area" className="notice-content">
                        {notices.length > 0 ? (
                            <div id="notice-table-row" className="notice-table-row">
                                <div id="notice-table-header" className={`table-header ${isAdmin ? 'admin' : ''}`}>
                                    <div id="notice-col-number" className="col-number">번호</div>
                                    <div id="notice-col-title" className="col-title">제목</div>
                                    <div id="notice-col-content" className="col-content">내용</div>
                                    <div id="notice-col-date" className="col-date">등록일</div>
                                    {isAdmin && <div id="notice-col-admin" className="col-admin">관리</div>}
                                </div>

                                {notices.map((notice, index) => (
                                    <div key={notice.nid}>
                                        <div
                                            id={`notice-table-row-${notice.nid}`}
                                            className={`table-row ${notice.is_important ? 'important' : ''} ${isAdmin ? 'admin' : ''}`}
                                        >
                                            <div id={`notice-number-${notice.nid}`} className="col-number">
                                                {notice.is_important ? (
                                                    <span id={`notice-badge-${notice.nid}`} className="important-badge">중요</span>
                                                ) : (
                                                    <span>{index + 1}</span>
                                                )}
                                            </div>

                                            {editingId === notice.nid ? (
                                                // 편집 모드
                                                <>
                                                    <div id={`notice-edit-title-${notice.nid}`} className="col-title">
                                                        <input
                                                            type="text"
                                                            name="title"
                                                            value={editForm.title}
                                                            onChange={handleEditFormChange}
                                                            id={`notice-edit-title-input-${notice.nid}`}
                                                            className="edit-input title-edit"
                                                        />
                                                    </div>
                                                    <div id={`notice-edit-content-${notice.nid}`} className="col-content">
                                                        <textarea
                                                            name="content"
                                                            value={editForm.content}
                                                            onChange={handleEditFormChange}
                                                            id={`notice-edit-content-input-${notice.nid}`}
                                                            className="edit-input content-edit"
                                                            rows="2"
                                                        />
                                                        <label id={`notice-edit-checkbox-${notice.nid}`} className="edit-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                name="is_important"
                                                                checked={editForm.is_important}
                                                                onChange={handleEditFormChange}
                                                                id={`notice-edit-important-${notice.nid}`}
                                                            />
                                                            중요
                                                        </label>
                                                    </div>
                                                    <div id={`notice-edit-date-${notice.nid}`} className="col-date">
                                                        {formatDate(notice.created_at)}
                                                    </div>
                                                    {isAdmin && (
                                                        <div id={`notice-edit-admin-${notice.nid}`} className="col-admin">
                                                            <button
                                                                type="button"
                                                                id={`notice-save-btn-${notice.nid}`}
                                                                className="admin-btn-small save-btn"
                                                                onClick={handleSaveEdit}
                                                            >
                                                                저장
                                                            </button>
                                                            <button
                                                                type="button"
                                                                id={`notice-cancel-btn-${notice.nid}`}
                                                                className="admin-btn-small cancel-btn"
                                                                onClick={cancelEditing}
                                                            >
                                                                취소
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                // 일반 모드
                                                <>
                                                    <div
                                                        id={`notice-title-${notice.nid}`}
                                                        className="col-title"
                                                        onClick={() => toggleExpand(notice.nid)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <span className="title">{notice.title}</span>
                                                        <span className="expand-icon">
                                                            {expandedId === notice.nid ? '▼' : '▶'}
                                                        </span>
                                                    </div>
                                                    <div id={`notice-content-${notice.nid}`} className="col-content">
                                                        <span className="content-preview">
                                                            {notice.content.length > 30
                                                                ? `${notice.content.substring(0, 30)}...`
                                                                : notice.content
                                                            }
                                                        </span>
                                                    </div>
                                                    <div id={`notice-date-${notice.nid}`} className="col-date">
                                                        {formatDate(notice.created_at)}
                                                    </div>
                                                    {isAdmin && (
                                                        <div id={`notice-admin-${notice.nid}`} className="col-admin">
                                                            <button
                                                                type="button"
                                                                id={`notice-edit-small-btn-${notice.nid}`}
                                                                className="admin-btn-small edit-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditing(notice);
                                                                }}
                                                            >
                                                                수정
                                                            </button>
                                                            <button
                                                                type="button"
                                                                id={`notice-delete-small-btn-${notice.nid}`}
                                                                className="admin-btn-small delete-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteNotice(notice.nid);
                                                                }}
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* 확장된 내용 */}
                                        {expandedId === notice.nid && (
                                            <div id={`notice-expanded-${notice.nid}`} className="notice-expanded-content">
                                                <div className="expanded-con-wrapper">
                                                    <div
                                                        className="notice-expanded-con"
                                                        dangerouslySetInnerHTML={{
                                                            __html: notice.content.replace(/\n/g, '<br>')
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div id="notice-empty-state" className="empty-state">
                                <p>등록된 공지사항이 없습니다.</p>
                                {isAdmin && (
                                    <p id="notice-admin-hint" className="admin-hint">위의 작성 폼을 사용해서 첫 번째 공지사항을 등록해보세요!</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Notice;