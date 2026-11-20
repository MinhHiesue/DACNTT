import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, LockKeyhole, Search, ShieldCheck, Trash2, UnlockKeyhole } from 'lucide-react'
import { PageHeading } from '../components/PageHeading.jsx'
import { deleteAdminUser, getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '../data/authApi.js'

export function AdminPage({ token, currentUser }) {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    getAdminUsers(token, { page, search, role, status }, controller.signal)
      .then((result) => {
        setUsers(result.users)
        setPagination(result.pagination)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [page, reloadKey, role, search, status, token])

  async function runAction(user, action) {
    setPendingId(user.id)
    setError('')
    setNotice('')
    try {
      if (action === 'role') {
        const nextRole = user.role === 'admin' ? 'user' : 'admin'
        await updateAdminUserRole(token, user.id, nextRole)
        setNotice(`Đã đổi quyền của ${user.email} thành ${nextRole}.`)
      } else if (action === 'status') {
        const nextStatus = !user.isActive
        await updateAdminUserStatus(token, user.id, nextStatus)
        setNotice(`Đã ${nextStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.email}.`)
      } else {
        const confirmed = window.confirm(`Xóa vĩnh viễn tài khoản ${user.email}? Thao tác này không thể hoàn tác.`)
        if (!confirmed) return
        await deleteAdminUser(token, user.id)
        setNotice(`Đã xóa tài khoản ${user.email}.`)
        if (users.length === 1 && page > 1) setPage((value) => value - 1)
      }

      setReloadKey((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPendingId('')
    }
  }

  const totalPages = Math.max(1, pagination.totalPages)

  return (
    <div className="utility-page">
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Quản lý tài khoản"
        subtitle="Tìm tài khoản, cập nhật quyền truy cập, khóa hoặc xóa người dùng."
        badge={`${pagination.total} TÀI KHOẢN`}
      />

      <form className="admin-toolbar" onSubmit={(event) => {
        event.preventDefault()
        setPage(1)
        setSearch(searchInput.trim())
      }}>
        <label className="admin-search">
          <span>TÌM TÀI KHOẢN</span>
          <div><Search size={15} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tên hoặc email" /></div>
        </label>
        <label className="admin-filter">
          <span>VAI TRÒ</span>
          <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }}>
            <option value="">Tất cả</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="admin-filter">
          <span>TRẠNG THÁI</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </label>
        <button className="primary-action" type="submit">Tìm kiếm</button>
      </form>

      {error && <p className="inline-feedback" role="alert">{error}</p>}
      {notice && <p className="inline-feedback feedback-success" role="status">{notice}</p>}

      <section className="utility-table-panel admin-table-panel">
        <div className="utility-table-scroll">
          <table className="admin-users-table">
            <thead>
              <tr><th>TÀI KHOẢN</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th><th>THAO TÁC</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="admin-table-message" colSpan="5">Đang tải tài khoản...</td></tr>
              ) : users.length === 0 ? (
                <tr><td className="admin-table-message" colSpan="5">Không tìm thấy tài khoản phù hợp.</td></tr>
              ) : users.map((user) => {
                const isSelf = user.id === currentUser.id
                return (
                  <tr key={user.id}>
                    <td><strong className="admin-user-name">{user.name}</strong><small className="admin-user-email">{user.email}</small>{isSelf && <small className="admin-self-label">TÀI KHOẢN CỦA BẠN</small>}</td>
                    <td><span className={`admin-role-badge ${user.role === 'admin' ? 'admin-role-admin' : ''}`}>{user.role === 'admin' ? <ShieldCheck size={12} /> : null}{user.role}</span></td>
                    <td><span className={`admin-status-badge ${user.isActive ? 'admin-status-active' : 'admin-status-locked'}`}><i />{user.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="admin-action-button" type="button" disabled={isSelf || Boolean(pendingId)} onClick={() => runAction(user, 'role')} title={isSelf ? 'Không thể tự hạ quyền' : 'Đổi vai trò'}>
                          {user.role === 'admin' ? 'Hạ quyền' : 'Cấp admin'}
                        </button>
                        <button className="admin-action-button" type="button" disabled={isSelf || Boolean(pendingId)} onClick={() => runAction(user, 'status')} title={isSelf ? 'Không thể tự khóa' : user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                          {user.isActive ? <LockKeyhole size={13} /> : <UnlockKeyhole size={13} />}
                          {user.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                        <button className="admin-delete-button" type="button" disabled={isSelf || Boolean(pendingId)} onClick={() => runAction(user, 'delete')} title={isSelf ? 'Không thể tự xóa' : 'Xóa vĩnh viễn'}>
                          <Trash2 size={13} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>{pagination.total ? `Trang ${page} / ${totalPages} · ${pagination.total} tài khoản` : 'Chưa có tài khoản'}</span>
          <div>
            <button type="button" aria-label="Trang trước" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /></button>
            <button type="button" aria-label="Trang sau" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
      <p className="admin-caution">Tài khoản admin cuối cùng không thể bị khóa, hạ quyền hoặc xóa. Bạn cũng không thể tự khóa hoặc xóa tài khoản đang đăng nhập.</p>
    </div>
  )
}
