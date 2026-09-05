/**
 * 2026 AI 커뮤니티 활동지원 - 모임 결과 보고서 애플리케이션
 * 모든 데이터가 Supabase 클라우드 데이터베이스(dmgtwzbvpualecnrcyug)에서 관리됩니다.
 * - public.ai_communities (10개 선정 커뮤니티 정보)
 * - public.ai_community_reports (모임 결과 보고서 - 1, 2, 3회차)
 * - public.ai_community_drafts (임시 저장)
 */

// 삭제 인증 비밀번호
const DELETE_PASSWORD = "0218";

// 애플리케이션 전역 상태
const state = {
  supabase: null,
  communities: [],
  reports: [],
  activeCommunityId: 1,
  selectedRound: 1,
  attendees: ["최○미", "김○수"],
  keywords: ["AI동화", "결과공유"],
  attachedFiles: [],
  isLoading: false,
  editingReportId: null, // 수정 모드일 때 해당 보고서 ID
  currentView: 'list', // 'list' | 'write'
  currentFilterRound: 'all', // 'all' | '1' | '2' | '3' | '4'
  pendingDeleteReportId: null, // 삭제 대기 중인 보고서 ID
  comments: [], // 모임 결과 보고서 댓글 목록 (public.ai_community_comments)
  openCommentsMap: {} // 보고서별 댓글창 열림/닫힘 상태 기억
};

// DOM 요소 캐시
const el = {
  // 상단 커뮤니티 헤더 카드
  communityHeaderCard: document.getElementById("communityHeaderCard"),
  commHeaderAvatar: document.getElementById("commHeaderAvatar"),
  commHeaderTitle: document.getElementById("commHeaderTitle"),
  commHeaderType: document.getElementById("commHeaderType"),
  commHeaderProject: document.getElementById("commHeaderProject"),
  btnDemoFillHeader: document.getElementById("btnDemoFillHeader"),
  btnOpenWrite: document.getElementById("btnOpenWrite"),

  // 뷰 탭 & 전환
  viewTabsBar: document.getElementById("viewTabsBar"),
  tabBtnList: document.getElementById("tabBtnList"),
  tabBtnWrite: document.getElementById("tabBtnWrite"),
  tabReportCount: document.getElementById("tabReportCount"),

  // 1. 게시글 목록 피드 뷰
  viewPostList: document.getElementById("viewPostList"),
  roundFilterGroup: document.getElementById("roundFilterGroup"),
  filteredPostCount: document.getElementById("filteredPostCount"),
  feedPostsWrap: document.getElementById("feedPostsWrap"),
  feedEmptyState: document.getElementById("feedEmptyState"),
  btnEmptyCreate: document.getElementById("btnEmptyCreate"),

  // 2. 작성/수정 폼 뷰
  viewPostWrite: document.getElementById("viewPostWrite"),
  btnBackToList: document.getElementById("btnBackToList"),
  formMainTitle: document.getElementById("formMainTitle"),
  formSubTitle: document.getElementById("formSubTitle"),
  btnCancelEdit: document.getElementById("btnCancelEdit"),

  channelList: document.getElementById("channelList"),
  communitySelect: document.getElementById("communitySelect"),
  bannerCommunityName: document.getElementById("bannerCommunityName"),
  bannerCommunityDesc: document.getElementById("bannerCommunityDesc"),
  bannerStepper: document.getElementById("bannerStepper"),
  step1: document.getElementById("step1"),
  step2: document.getElementById("step2"),
  step3: document.getElementById("step3"),
  stepDiv1: document.getElementById("stepDiv1"),
  stepDiv2: document.getElementById("stepDiv2"),
  roundSelectorGroup: document.getElementById("roundSelectorGroup"),
  reportTitle: document.getElementById("reportTitle"),
  meetingDate: document.getElementById("meetingDate"),
  meetingLocation: document.getElementById("meetingLocation"),
  attendeeInput: document.getElementById("attendeeInput"),
  btnAddAttendee: document.getElementById("btnAddAttendee"),
  attendeeChips: document.getElementById("attendeeChips"),
  editorContent: document.getElementById("editorContent"),
  charCounter: document.getElementById("charCounter"),
  uploadDropzone: document.getElementById("uploadDropzone"),
  fileInput: document.getElementById("fileInput"),
  btnSelectFile: document.getElementById("btnSelectFile"),
  attachedCount: document.getElementById("attachedCount"),
  emptyAttachedNotice: document.getElementById("emptyAttachedNotice"),
  attachedFileList: document.getElementById("attachedFileList"),
  keywordInput: document.getElementById("keywordInput"),
  keywordCounter: document.getElementById("keywordCounter"),
  keywordChips: document.getElementById("keywordChips"),
  btnDraftSave: document.getElementById("btnDraftSave"),
  btnPreview: document.getElementById("btnPreview"),
  btnPublish: document.getElementById("btnPublish"),
  btnDemoFill: document.getElementById("btnDemoFill"),
  btnViewArchive: document.getElementById("btnViewArchive"),
  submittedCount: document.getElementById("submittedCount"),
  previewModal: document.getElementById("previewModal"),
  previewModalBody: document.getElementById("previewModalBody"),
  btnClosePreview: document.getElementById("btnClosePreview"),
  btnClosePreviewFooter: document.getElementById("btnClosePreviewFooter"),
  btnPublishFromPreview: document.getElementById("btnPublishFromPreview"),
  btnDownloadPreviewPdf: document.getElementById("btnDownloadPreviewPdf"),
  archiveModal: document.getElementById("archiveModal"),
  archiveListContainer: document.getElementById("archiveListContainer"),
  btnCloseArchive: document.getElementById("btnCloseArchive"),
  btnCloseArchiveFooter: document.getElementById("btnCloseArchiveFooter"),
  toastContainer: document.getElementById("toastContainer"),
  formatBlockSelect: document.getElementById("formatBlockSelect"),
  btnInsertLink: document.getElementById("btnInsertLink"),
  supabaseStatusBadge: document.getElementById("supabaseStatusBadge"),
  supabaseStatusDot: document.getElementById("supabaseStatusDot"),
  supabaseStatusText: document.getElementById("supabaseStatusText"),

  // 삭제 확인 모달
  deleteConfirmModal: document.getElementById("deleteConfirmModal"),
  deleteTargetTitle: document.getElementById("deleteTargetTitle"),
  deletePasswordInput: document.getElementById("deletePasswordInput"),
  deletePasswordError: document.getElementById("deletePasswordError"),
  btnCloseDeleteModal: document.getElementById("btnCloseDeleteModal"),
  btnCancelDelete: document.getElementById("btnCancelDelete"),
  btnConfirmDelete: document.getElementById("btnConfirmDelete")
};

// SVG 아이콘 생성 함수
function getIconSvg(type) {
  switch (type) {
    case 'book': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    case 'music': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    case 'cooking': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M6 2v20"/><path d="M4 2h4"/></svg>`;
    case 'vr': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4a2 2 0 0 0-1.6.8L13 20.4a1.7 1.7 0 0 1-2 0l-1.4-1.6A2 2 0 0 0 8 18H4a2 2 0 0 1-2-2v-6z"/><circle cx="7" cy="14" r="1.5"/><circle cx="17" cy="14" r="1.5"/></svg>`;
    case 'heart': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    case 'guitar': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="2" x2="10" y2="10"/><path d="m14 10 7-7"/><path d="M12 12c-2.8 0-5 2.2-5 5a5 5 0 0 0 7.5 4.3l.5-.3a5 5 0 0 0 2-4c0-2.8-2.2-5-5-5Z"/></svg>`;
    case 'video': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
    case 'users': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    case 'instagram': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
    case 'star':
    default:
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
}

// 1. 초기화
async function init() {
  setupEventListeners();
  setupEditor();
  setDefaultDateTime();
  renderAttendees();
  renderKeywords();

  // Supabase 클라이언트 연결
  state.supabase = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!state.supabase) {
    // CDN 비동기 로딩 대기
    let retry = 0;
    while (!state.supabase && retry < 10) {
      await new Promise(r => setTimeout(r, 200));
      state.supabase = window.getSupabaseClient ? window.getSupabaseClient() : null;
      retry++;
    }
  }

  updateSupabaseStatus(!!state.supabase);

  // Supabase로부터 데이터 비동기 로드
  await loadAllDataFromSupabase();
}

// Supabase 연결 상태 갱신
function updateSupabaseStatus(connected) {
  if (!el.supabaseStatusBadge) return;
  if (connected) {
    el.supabaseStatusBadge.style.backgroundColor = "#ecfdf5";
    el.supabaseStatusBadge.style.borderColor = "#a7f3d0";
    el.supabaseStatusBadge.style.color = "#065f46";
    el.supabaseStatusDot.style.backgroundColor = "#10b981";
    el.supabaseStatusText.textContent = "Supabase 실시간 연동됨";
  } else {
    el.supabaseStatusBadge.style.backgroundColor = "#fff1f2";
    el.supabaseStatusBadge.style.borderColor = "#fecdd3";
    el.supabaseStatusBadge.style.color = "#9f1239";
    el.supabaseStatusDot.style.backgroundColor = "#f43f5e";
    el.supabaseStatusText.textContent = "Supabase 연결 대기중";
  }
}

// 2. Supabase 데이터 로드
async function loadAllDataFromSupabase() {
  if (!state.supabase) {
    showToast("Supabase 연결을 확인해주세요.", "warn");
    return;
  }

  state.isLoading = true;

  try {
    // 1) 커뮤니티 10개 목록 조회 (public.ai_communities)
    const { data: comms, error: commError } = await state.supabase
      .from('ai_communities')
      .select('*')
      .order('id', { ascending: true });

    if (commError) throw commError;
    state.communities = comms || [];

    // 2) 제출된 모임 보고서 목록 조회 (public.ai_community_reports)
    const { data: reps, error: repError } = await state.supabase
      .from('ai_community_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (repError) throw repError;
    state.reports = reps || [];

    // 3) 댓글 목록 조회 (public.ai_community_comments)
    try {
      const { data: comments, error: commentError } = await state.supabase
        .from('ai_community_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (!commentError && comments) {
        state.comments = comments;
      }
    } catch (cErr) {
      console.warn("댓글 로드 알림:", cErr);
    }

    // UI 렌더링
    renderSidebarChannels();
    populateCommunitySelect();
    updateArchiveCounter();

    // 첫 번째 커뮤니티 활성화
    if (state.communities.length > 0) {
      selectCommunity(state.activeCommunityId || state.communities[0].id);
    }

    // 활성 커뮤니티의 Supabase 임시저장 불러오기
    await loadDraftFromSupabase(state.activeCommunityId);

  } catch (err) {
    console.error("[Supabase Load Error]", err);
    showToast("Supabase 데이터 동기화 중 오류가 발생했습니다: " + err.message, "warn");
  } finally {
    state.isLoading = false;
  }
}

// 각 커뮤니티별 제출된 모임 횟수 계산 (최소 3회 기준)
function getCommunityMeetingCount(commId) {
  return state.reports.filter(r => r.community_id === Number(commId)).length;
}

// 3. 좌측 사이드바 채널 리스트 렌더링 (최소 3회 모임 진행도 반영)
function renderSidebarChannels() {
  el.channelList.innerHTML = "";

  state.communities.forEach(comm => {
    const meetingCount = getCommunityMeetingCount(comm.id);
    const isCompletedAll = meetingCount >= (comm.required_meetings || 3);

    const card = document.createElement("div");
    card.className = `channel-card ${comm.id === state.activeCommunityId ? "active" : ""}`;
    card.dataset.id = comm.id;

    // 모임 진행 상태 점 3개 표시 (최소 3회 의무)
    let dotsHtml = "";
    for (let i = 1; i <= 3; i++) {
      const isFilled = meetingCount >= i;
      const dotClass = isFilled ? (isCompletedAll ? "prog-dot completed complete-all" : "prog-dot completed") : "prog-dot";
      dotsHtml += `<div class="${dotClass}" title="${i}회차 모임"></div>`;
    }

    const progLabel = isCompletedAll 
      ? `<span class="prog-label done">✓ 3/3회 완료</span>`
      : `<span class="prog-label">${meetingCount}/3회 진행</span>`;

    card.innerHTML = `
      <div class="channel-num">${comm.num}</div>
      <div class="channel-icon-wrap">${getIconSvg(comm.icon_type)}</div>
      <div class="channel-text">
        <div class="channel-name">${comm.name}</div>
        <div class="channel-desc" title="${comm.project}">${comm.description || comm.project}</div>
        <div class="channel-progress-row">
          <div class="channel-progress-dots">${dotsHtml}</div>
          ${progLabel}
        </div>
      </div>
      <div class="channel-chevron">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    `;

    card.addEventListener("click", () => {
      selectCommunity(comm.id);
    });

    el.channelList.appendChild(card);
  });
}

// 4. 커뮤니티 셀렉트박스 옵션 채우기
function populateCommunitySelect() {
  el.communitySelect.innerHTML = `<option value="">연구 분과(커뮤니티)를 선택해주세요</option>`;
  state.communities.forEach(comm => {
    const opt = document.createElement("option");
    opt.value = comm.id;
    opt.textContent = `[${comm.num}] ${comm.name} (${comm.representative} 대표 - ${comm.type})`;
    el.communitySelect.appendChild(opt);
  });
}

// 5. 커뮤니티 선택 시 헤더/배너/스테퍼 및 피드 갱신
async function selectCommunity(commId) {
  state.activeCommunityId = Number(commId);

  // 사이드바 active 클래스 변경
  document.querySelectorAll(".channel-card").forEach(card => {
    card.classList.toggle("active", Number(card.dataset.id) === state.activeCommunityId);
  });

  // 셀렉트박스 동기화
  if (el.communitySelect && el.communitySelect.value != state.activeCommunityId) {
    el.communitySelect.value = state.activeCommunityId;
  }

  const comm = state.communities.find(c => c.id === state.activeCommunityId);
  if (!comm) return;

  const count = getCommunityMeetingCount(comm.id);
  const nextRound = Math.min(count + 1, 3);
  setMeetingRound(nextRound);

  // 상단 커뮤니티 헤더 카드 갱신
  if (el.commHeaderAvatar) el.commHeaderAvatar.innerHTML = getIconSvg(comm.icon_type);
  if (el.commHeaderTitle) el.commHeaderTitle.textContent = `${comm.num} ${comm.name}`;
  if (el.commHeaderType) el.commHeaderType.textContent = comm.type;
  if (el.commHeaderProject) el.commHeaderProject.textContent = `${comm.project} (대표자: ${comm.representative})`;

  // 배너 텍스트 갱신
  if (el.bannerCommunityName) {
    el.bannerCommunityName.textContent = `[${comm.num} ${comm.name}] 모임 진행 현황: ${count}/3회 완료 (최소 3회 의무)`;
  }
  if (el.bannerCommunityDesc) {
    el.bannerCommunityDesc.textContent = `프로젝트: ${comm.project} (대표자: ${comm.representative})`;
  }

  updateStepper(count, state.selectedRound);

  // 우측 게시글 피드 렌더링
  renderPostFeed();

  // 커뮤니티 변경 시 해당 커뮤니티의 Supabase 드래프트 확인
  await loadDraftFromSupabase(state.activeCommunityId);
}

// 뷰 전환 함수 (목록 뷰 <-> 작성/수정 폼 뷰)
function switchView(viewName) {
  state.currentView = viewName;

  if (viewName === 'write') {
    if (el.viewPostList) el.viewPostList.style.display = 'none';
    if (el.viewPostWrite) el.viewPostWrite.style.display = 'block';
    if (el.tabBtnList) el.tabBtnList.classList.remove('active');
    if (el.tabBtnWrite) el.tabBtnWrite.classList.add('active');
    const formCard = document.querySelector('.form-card');
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    if (el.viewPostList) el.viewPostList.style.display = 'flex';
    if (el.viewPostWrite) el.viewPostWrite.style.display = 'none';
    if (el.tabBtnList) el.tabBtnList.classList.add('active');
    if (el.tabBtnWrite) el.tabBtnWrite.classList.remove('active');
    renderPostFeed();
  }
}

// 문자열 HTML 이스케이프 및 줄바꿈 처리
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, "<br>");
}

// 상대 시간 포맷팅 (방금 전, N분 전, N시간 전, 날짜)
function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "방금 전";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 최신 댓글만 재조회 후 피드 갱신
async function reloadComments() {
  if (!state.supabase) return;
  try {
    const { data: comments, error } = await state.supabase
      .from('ai_community_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && comments) {
      state.comments = comments;
      renderPostFeed();
    }
  } catch (err) {
    console.error("댓글 재조회 오류:", err);
  }
}

// 댓글 삭제 (비밀번호 0218 검증)
async function deleteComment(commentId, reportId) {
  const pw = prompt("댓글을 삭제하려면 비밀번호(0218)를 입력해주세요:");
  if (pw === null) return;
  if (pw !== DELETE_PASSWORD) {
    showToast("비밀번호가 일치하지 않습니다.", "warn");
    return;
  }

  try {
    const { error } = await state.supabase
      .from('ai_community_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    showToast("댓글이 삭제되었습니다.", "info");
    state.openCommentsMap[reportId] = true;
    await reloadComments();
  } catch (err) {
    console.error("댓글 삭제 실패:", err);
    showToast("댓글 삭제 실패: " + err.message, "warn");
  }
}

// 우측 게시글 목록 피드 렌더링
function renderPostFeed() {
  if (!el.feedPostsWrap) return;

  const commReports = state.reports.filter(r => r.community_id === state.activeCommunityId);

  if (el.tabReportCount) {
    el.tabReportCount.textContent = commReports.length;
  }

  // 회차 필터링
  let displayReports = commReports;
  if (state.currentFilterRound !== 'all') {
    const roundNum = Number(state.currentFilterRound);
    if (roundNum === 4) {
      displayReports = commReports.filter(r => r.meeting_round >= 4);
    } else {
      displayReports = commReports.filter(r => r.meeting_round === roundNum);
    }
  }

  if (el.filteredPostCount) {
    el.filteredPostCount.textContent = displayReports.length;
  }

  if (displayReports.length === 0) {
    el.feedPostsWrap.style.display = "none";
    if (el.feedEmptyState) el.feedEmptyState.style.display = "flex";
    return;
  }

  el.feedPostsWrap.style.display = "flex";
  if (el.feedEmptyState) el.feedEmptyState.style.display = "none";
  el.feedPostsWrap.innerHTML = "";

  displayReports.forEach(rep => {
    const card = document.createElement("article");
    card.className = "post-card";
    card.id = `post-${rep.id}`;

    const dateStr = rep.meeting_date ? rep.meeting_date.replace("T", " ") : "일시 미기재";
    const attendeesList = Array.isArray(rep.attendees) ? rep.attendees : [];
    const keywordsList = Array.isArray(rep.keywords) ? rep.keywords : [];
    const filesList = Array.isArray(rep.files) ? rep.files : [];

    const isObligatoryDone = rep.meeting_round === 3;
    const roundBadgeText = isObligatoryDone 
      ? `3회차 모임 (최소 의무 완료 🎉)` 
      : `${rep.meeting_round}회차 모임`;

    // 사진 갤러리 렌더링
    const photosHtml = filesList.length > 0
      ? `<div class="post-gallery">${filesList.map(f => {
          const src = f.storageUrl || f.dataUrl;
          return `<img src="${src}" alt="${f.name}" class="post-photo-thumb" title="${f.name} (클릭하여 확대)" onclick="openLightbox('${src}', '${f.name}')">`;
        }).join("")}</div>`
      : "";

    // 참석자 태그
    const attendeesChips = attendeesList.length > 0
      ? attendeesList.map(a => `<span class="tag-chip" style="font-size:0.75rem; padding:2px 8px;">${a}</span>`).join(" ")
      : "<span style='color:#94a3b8;'>참석자 없음</span>";

    // 키워드 태그
    const keywordsChips = keywordsList.length > 0
      ? keywordsList.map(k => `<span class="tag-chip" style="font-size:0.75rem; padding:2px 8px; background:#f1f5f9; color:#475569; border-color:#e2e8f0;">#${k}</span>`).join(" ")
      : "";

    // 해당 보고서의 댓글 목록
    const reportComments = Array.isArray(state.comments)
      ? state.comments.filter(c => c.report_id === rep.id)
      : [];
    const isCommentsOpen = state.openCommentsMap[rep.id] ?? (reportComments.length > 0);
    const comm = state.communities.find(c => c.id === rep.community_id);
    const defaultAuthor = comm ? comm.representative : "";

    const commentsListHtml = reportComments.length === 0
      ? `<div class="comment-empty-msg">아직 등록된 댓글이 없습니다. 첫 번째 소감이나 피드백을 남겨보세요! ✨</div>`
      : reportComments.map(c => `
          <div class="comment-item" id="comment-${c.id}">
            <div class="comment-avatar">${(c.author_name || '익').trim().slice(0, 1)}</div>
            <div class="comment-content-area">
              <div class="comment-item-header">
                <div class="comment-author-wrap">
                  <span class="comment-author">${escapeHtml(c.author_name)}</span>
                  <span class="comment-time">${formatRelativeTime(c.created_at)}</span>
                </div>
                <button type="button" class="btn-del-comment" data-del-comment="${c.id}" title="댓글 삭제">
                  &times;
                </button>
              </div>
              <div class="comment-text">${escapeHtml(c.content)}</div>
            </div>
          </div>
        `).join("");

    card.innerHTML = `
      <div class="post-card-header">
        <div>
          <div class="post-badge-row">
            <span class="post-round-badge ${isObligatoryDone ? 'obligatory-done' : ''}">${roundBadgeText}</span>
            <span class="post-comm-tag">${rep.community_name}</span>
          </div>
          <h2 class="post-title">${rep.title}</h2>
        </div>
        <div class="post-actions">
          <button type="button" class="btn-card-action btn-card-pdf" data-pdf="${rep.id}" title="공식 서식 PDF 다운로드">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            PDF
          </button>
          <button type="button" class="btn-card-action btn-card-edit" data-edit="${rep.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            수정
          </button>
          <button type="button" class="btn-card-action btn-card-del" data-del="${rep.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            삭제
          </button>
        </div>
      </div>

      <div class="post-meta-bar">
        <div class="meta-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${dateStr}</span>
        </div>
        <div class="meta-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${rep.location || '장소 미기재'}</span>
        </div>
        <div class="meta-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <div style="display:inline-flex; gap:4px; flex-wrap:wrap;">${attendeesChips}</div>
        </div>
      </div>

      <div class="post-content-snippet">
        ${rep.content}
      </div>

      ${photosHtml}

      <div class="post-footer">
        <div class="post-keywords">
          ${keywordsChips}
        </div>
        <div class="post-date-posted">
          등록: ${rep.created_at ? new Date(rep.created_at).toLocaleDateString('ko-KR') : ''}
        </div>
      </div>

      <!-- 댓글 영역 -->
      <div class="post-comments-section" id="commentsSection-${rep.id}">
        <div class="comments-toggle-header">
          <button type="button" class="btn-toggle-comments" data-toggle-comments="${rep.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            댓글 <span class="comment-count-badge" id="commentBadge-${rep.id}">${reportComments.length}</span>
          </button>
          <span style="font-size:0.75rem; color:#94a3b8;">열린 소통 공간</span>
        </div>

        <div class="comments-container" id="commentsContainer-${rep.id}" style="${isCommentsOpen ? 'display: flex;' : 'display: none;'}">
          <div class="comments-list" id="commentsList-${rep.id}">
            ${commentsListHtml}
          </div>

          <form class="comment-write-box" data-form-report="${rep.id}">
            <div class="comment-input-row">
              <input type="text" class="comment-input-author" placeholder="작성자명 (필수)" maxlength="20" required value="${defaultAuthor}">
              <span class="comment-tip-text">Ctrl+Enter로 등록 가능</span>
            </div>
            <div class="comment-textarea-row">
              <textarea class="comment-input-content" placeholder="모임 결과에 대한 격려나 소감, 피드백을 남겨주세요..." rows="2" required></textarea>
              <button type="submit" class="btn-submit-comment">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // PDF 다운로드 버튼 클릭
    card.querySelector(`[data-pdf="${rep.id}"]`).addEventListener("click", () => {
      downloadReportPDF(rep);
    });

    // 수정 버튼 클릭 -> 폼으로 이동
    card.querySelector(`[data-edit="${rep.id}"]`).addEventListener("click", () => {
      startEditReport(rep.id);
    });

    // 삭제 버튼 클릭 -> 비밀번호 확인 모달 호출
    card.querySelector(`[data-del="${rep.id}"]`).addEventListener("click", () => {
      openDeleteModal(rep.id, rep.title);
    });

    // 댓글 영역 토글
    const toggleBtn = card.querySelector(`[data-toggle-comments="${rep.id}"]`);
    const commentsContainer = card.querySelector(`#commentsContainer-${rep.id}`);
    if (toggleBtn && commentsContainer) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = commentsContainer.style.display === "none";
        commentsContainer.style.display = isHidden ? "flex" : "none";
        state.openCommentsMap[rep.id] = isHidden;
      });
    }

    // 댓글 작성 폼 제출
    const commentForm = card.querySelector(`[data-form-report="${rep.id}"]`);
    if (commentForm) {
      const authorInput = commentForm.querySelector(".comment-input-author");
      const contentInput = commentForm.querySelector(".comment-input-content");
      const submitBtn = commentForm.querySelector(".btn-submit-comment");

      // Ctrl + Enter 단축키
      contentInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          commentForm.requestSubmit();
        }
      });

      commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const author = authorInput.value.trim();
        const content = contentInput.value.trim();
        if (!author || !content) {
          showToast("작성자와 내용을 모두 입력해주세요.", "warn");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "등록중...";

        try {
          const { error } = await state.supabase
            .from('ai_community_comments')
            .insert([{
              report_id: rep.id,
              author_name: author,
              content: content
            }]);

          if (error) throw error;

          contentInput.value = "";
          showToast("댓글이 등록되었습니다!", "success");
          state.openCommentsMap[rep.id] = true;

          // 댓글만 최신 재조회 후 피드 갱신
          await reloadComments();
        } catch (cErr) {
          console.error("댓글 등록 실패:", cErr);
          showToast("댓글 등록 실패: " + cErr.message, "warn");
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> 등록`;
        }
      });
    }

    // 댓글 삭제 버튼 클릭
    card.querySelectorAll(`[data-del-comment]`).forEach(btn => {
      btn.addEventListener("click", () => {
        const commentId = btn.dataset.delComment;
        deleteComment(commentId, rep.id);
      });
    });

    el.feedPostsWrap.appendChild(card);
  });
}

// 6. 모임 회차 선택 및 스테퍼 상태 갱신
function setMeetingRound(roundNum) {
  state.selectedRound = Number(roundNum);

  // 알약 버튼 토글
  document.querySelectorAll(".round-pill").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.round) === state.selectedRound);
  });

  const count = getCommunityMeetingCount(state.activeCommunityId);
  updateStepper(count, state.selectedRound);
}

function updateStepper(completedCount, currentRound) {
  // 1회차
  if (completedCount >= 1) {
    el.step1.className = "step-item completed";
    el.step1.querySelector(".step-circle").textContent = "✓";
  } else if (currentRound === 1) {
    el.step1.className = "step-item active";
    el.step1.querySelector(".step-circle").textContent = "1";
  } else {
    el.step1.className = "step-item";
    el.step1.querySelector(".step-circle").textContent = "1";
  }

  // 연결선 1
  el.stepDiv1.className = completedCount >= 1 ? "step-divider filled" : "step-divider";

  // 2회차
  if (completedCount >= 2) {
    el.step2.className = "step-item completed";
    el.step2.querySelector(".step-circle").textContent = "✓";
  } else if (currentRound === 2) {
    el.step2.className = "step-item active";
    el.step2.querySelector(".step-circle").textContent = "2";
  } else {
    el.step2.className = "step-item";
    el.step2.querySelector(".step-circle").textContent = "2";
  }

  // 연결선 2
  el.stepDiv2.className = completedCount >= 2 ? "step-divider filled" : "step-divider";

  // 3회차
  if (completedCount >= 3) {
    el.step3.className = "step-item completed";
    el.step3.querySelector(".step-circle").textContent = "✓";
  } else if (currentRound === 3) {
    el.step3.className = "step-item active";
    el.step3.querySelector(".step-circle").textContent = "3";
  } else {
    el.step3.className = "step-item";
    el.step3.querySelector(".step-circle").textContent = "3";
  }
}

// 7. 참석자 태그 칩 관리
function addAttendee(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (state.attendees.includes(trimmed)) {
    showToast("이미 추가된 참석자입니다.", "warn");
    return;
  }
  state.attendees.push(trimmed);
  renderAttendees();
  el.attendeeInput.value = "";
}

function removeAttendee(index) {
  state.attendees.splice(index, 1);
  renderAttendees();
}

function renderAttendees() {
  el.attendeeChips.innerHTML = "";
  state.attendees.forEach((name, idx) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.innerHTML = `
      <span>${name}</span>
      <button type="button" class="chip-remove" title="삭제">&times;</button>
    `;
    chip.querySelector(".chip-remove").addEventListener("click", () => removeAttendee(idx));
    el.attendeeChips.appendChild(chip);
  });
}

// 8. 관련 키워드 태그 관리 (최대 5개)
function addKeyword(keyword) {
  let trimmed = keyword.trim().replace(/^#/, "");
  if (!trimmed) return;
  if (state.keywords.length >= 5) {
    showToast("키워드는 최대 5개까지 등록 가능합니다.", "warn");
    return;
  }
  if (state.keywords.includes(trimmed)) {
    showToast("이미 등록된 키워드입니다.", "warn");
    return;
  }
  state.keywords.push(trimmed);
  renderKeywords();
  el.keywordInput.value = "";
}

function removeKeyword(index) {
  state.keywords.splice(index, 1);
  renderKeywords();
}

function renderKeywords() {
  el.keywordChips.innerHTML = "";
  state.keywords.forEach((kw, idx) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.innerHTML = `
      <span>#${kw}</span>
      <button type="button" class="chip-remove" title="삭제">&times;</button>
    `;
    chip.querySelector(".chip-remove").addEventListener("click", () => removeKeyword(idx));
    el.keywordChips.appendChild(chip);
  });

  el.keywordCounter.textContent = `${state.keywords.length} / 5`;
}

// 9. 파일 첨부 관리 & Supabase Storage 업로드 지원
function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일(JPG, PNG, GIF, WebP)만 첨부할 수 있습니다.", "warn");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(`${file.name}의 크기가 10MB를 초과합니다.`, "warn");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      state.attachedFiles.push({
        rawFile: file,
        name: file.name,
        size: formatFileSize(file.size),
        dataUrl: e.target.result,
        storageUrl: null
      });
      renderAttachedFiles();
      showToast(`사진 '${file.name}'이(가) 첨부되었습니다.`, "info");
    };
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function removeFile(index) {
  state.attachedFiles.splice(index, 1);
  renderAttachedFiles();
}

function openLightbox(imgSrc, caption) {
  const modal = document.getElementById("lightboxModal");
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCaption");
  if (modal && img) {
    img.src = imgSrc;
    if (cap) cap.textContent = caption || "";
    modal.classList.add("open");
  }
}

function closeLightbox() {
  const modal = document.getElementById("lightboxModal");
  if (modal) modal.classList.remove("open");
}

function renderAttachedFiles() {
  el.attachedCount.textContent = state.attachedFiles.length;

  if (state.attachedFiles.length === 0) {
    el.emptyAttachedNotice.style.display = "flex";
    el.attachedFileList.innerHTML = "";
    return;
  }

  el.emptyAttachedNotice.style.display = "none";
  el.attachedFileList.innerHTML = "";

  state.attachedFiles.forEach((f, idx) => {
    const item = document.createElement("div");
    item.className = "file-item";
    const src = f.storageUrl || f.dataUrl;
    item.innerHTML = `
      <img class="file-thumb" src="${src}" alt="${f.name}" title="클릭하여 원본 사진 보기">
      <div class="file-info">
        <div class="file-name" title="${f.name}">${f.name}</div>
        <div class="file-size">
          <span>${f.size}</span>
          <span class="file-storage-tag">Supabase Storage</span>
        </div>
      </div>
      <button type="button" class="file-delete-btn" title="사진 삭제">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    item.querySelector(".file-thumb").addEventListener("click", () => openLightbox(src, f.name));
    item.querySelector(".file-delete-btn").addEventListener("click", () => removeFile(idx));
    el.attachedFileList.appendChild(item);
  });
}

// Supabase Storage 버킷 'ai-community-photos'로 실제 파일 업로드
async function uploadFilesToSupabaseStorage() {
  if (!state.supabase || state.attachedFiles.length === 0) return;

  const bucket = 'ai-community-photos';

  for (const f of state.attachedFiles) {
    if (f.storageUrl) continue; // 이미 업로드 완료된 경우 스킵
    if (!f.rawFile) {
      f.storageUrl = f.dataUrl;
      continue;
    }

    try {
      const ext = f.name.split('.').pop() || 'jpg';
      const fileName = `comm_${state.activeCommunityId}_round${state.selectedRound}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = `reports/${fileName}`;

      const { data, error } = await state.supabase.storage
        .from(bucket)
        .upload(filePath, f.rawFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // 공개 URL 획득
      const { data: urlData } = state.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      f.storageUrl = urlData.publicUrl;
      console.log(`[Supabase Storage] 업로드 완료: ${f.name} -> ${f.storageUrl}`);
    } catch (err) {
      console.warn(`[Supabase Storage 업로드 경고] ${f.name}:`, err.message);
      f.storageUrl = f.dataUrl; // 실패 시 base64 dataUrl 사용
    }
  }
}

// 10. 리치 텍스트 에디터
function setupEditor() {
  document.querySelectorAll(".editor-toolbar button[data-cmd]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val || null;
      document.execCommand(cmd, false, val);
      el.editorContent.focus();
      updateCharCount();
    });
  });

  el.formatBlockSelect.addEventListener("change", () => {
    const val = el.formatBlockSelect.value;
    document.execCommand("formatBlock", false, `<${val}>`);
    el.editorContent.focus();
  });

  el.btnInsertLink.addEventListener("click", () => {
    const url = prompt("연결할 웹 주소(URL)를 입력해주세요:", "https://");
    if (url) {
      document.execCommand("createLink", false, url);
    }
  });

  el.editorContent.addEventListener("input", updateCharCount);
}

function updateCharCount() {
  const text = el.editorContent.innerText || "";
  const len = text.length;
  el.charCounter.textContent = `${len} / 3000`;
  el.charCounter.style.color = len > 3000 ? "var(--danger)" : "var(--text-muted)";
}

// 11. 현재 일시 기본값 설정
function setDefaultDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  el.meetingDate.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 12. Supabase 임시저장 (Draft)
async function saveDraft() {
  if (!state.supabase) {
    showToast("Supabase 연결이 필요합니다.", "warn");
    return;
  }

  const draftData = {
    community_id: state.activeCommunityId,
    title: el.reportTitle.value.trim(),
    meeting_round: state.selectedRound,
    meeting_date: el.meetingDate.value,
    location: el.meetingLocation.value.trim(),
    attendees: state.attendees,
    content: el.editorContent.innerHTML,
    keywords: state.keywords,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await state.supabase
      .from('ai_community_drafts')
      .upsert(draftData, { onConflict: 'community_id' });

    if (error) throw error;
    showToast(`Supabase 클라우드에 임시 저장되었습니다 (${new Date().toLocaleTimeString('ko-KR')})`, "info");
  } catch (err) {
    console.error("[Supabase Draft Error]", err);
    showToast("임시 저장 실패: " + err.message, "warn");
  }
}

async function loadDraftFromSupabase(commId) {
  if (!state.supabase) return;

  try {
    const { data, error } = await state.supabase
      .from('ai_community_drafts')
      .select('*')
      .eq('community_id', Number(commId))
      .maybeSingle();

    if (error) return;
    if (data && data.title) {
      el.reportTitle.value = data.title || "";
      if (data.meeting_date) el.meetingDate.value = data.meeting_date;
      if (data.location) el.meetingLocation.value = data.location;
      if (data.content) el.editorContent.innerHTML = data.content;
      if (Array.isArray(data.attendees)) {
        state.attendees = data.attendees;
        renderAttendees();
      }
      if (Array.isArray(data.keywords)) {
        state.keywords = data.keywords;
        renderKeywords();
      }
      if (data.meeting_round) {
        setMeetingRound(data.meeting_round);
      }
      updateCharCount();
      showToast(`이전에 작성 중이던 [${data.title}] 임시저장 내용을 불러왔습니다.`, "info");
    }
  } catch (e) {
    console.warn("드래프트 로드 예외:", e);
  }
}

// 13. 유효성 검사 및 Supabase 게시하기
function validateReport() {
  if (!el.reportTitle.value.trim()) {
    showToast("모임 제목을 입력해주세요.", "warn");
    el.reportTitle.focus();
    return false;
  }
  if (!el.meetingDate.value) {
    showToast("모임 일시를 선택해주세요.", "warn");
    el.meetingDate.focus();
    return false;
  }
  if (!el.communitySelect.value) {
    showToast("연구 분과(커뮤니티)를 선택해주세요.", "warn");
    el.communitySelect.focus();
    return false;
  }
  const contentText = el.editorContent.innerText.trim();
  if (!contentText) {
    showToast("모임 내용 및 결과를 작성해주세요.", "warn");
    el.editorContent.focus();
    return false;
  }
  return true;
}

async function publishReport() {
  if (!validateReport()) return;
  if (!state.supabase) {
    showToast("Supabase 데이터베이스에 연결할 수 없습니다.", "warn");
    return;
  }

  const comm = state.communities.find(c => c.id === state.activeCommunityId);
  const commName = comm ? comm.name : "";

  try {
    el.btnPublish.disabled = true;
    el.btnPublish.textContent = state.editingReportId ? "수정 내용 저장 중..." : "사진 및 데이터 저장 중...";

    // 1) 첨부 사진이 있는 경우 Supabase Storage ('ai-community-photos')에 실제 업로드
    if (state.attachedFiles.length > 0) {
      showToast("첨부된 사진을 Supabase Storage에 업로드하는 중입니다...", "info");
      await uploadFilesToSupabaseStorage();
    }

    // 2) 첨부 파일 메타데이터 가공 (Supabase Storage 공개 URL 또는 dataUrl)
    const filePayload = state.attachedFiles.map(f => ({
      name: f.name,
      size: f.size,
      storageUrl: f.storageUrl || f.dataUrl,
      dataUrl: f.storageUrl || f.dataUrl
    }));

    const payload = {
      community_id: state.activeCommunityId,
      community_name: commName,
      meeting_round: state.selectedRound,
      title: el.reportTitle.value.trim(),
      meeting_date: el.meetingDate.value,
      location: el.meetingLocation.value.trim() || "장소 미기재",
      attendees: state.attendees,
      content: el.editorContent.innerHTML,
      keywords: state.keywords,
      files: filePayload,
      updated_at: new Date().toISOString()
    };

    if (state.editingReportId) {
      // [수정 모드]: Supabase UPDATE
      const { error } = await state.supabase
        .from('ai_community_reports')
        .update(payload)
        .eq('id', state.editingReportId);

      if (error) throw error;

      showToast(`'${payload.title}' 보고서가 성공적으로 수정되었습니다!`, "success");
      cancelEditReport();
    } else {
      // [신규 등록]: Supabase INSERT
      const { error } = await state.supabase
        .from('ai_community_reports')
        .insert([payload]);

      if (error) throw error;

      // 임시저장 테이블 정리
      await state.supabase
        .from('ai_community_drafts')
        .delete()
        .eq('community_id', state.activeCommunityId);

      const totalCompleted = getCommunityMeetingCount(state.activeCommunityId);
      const requirementMsg = totalCompleted >= 3 
        ? `🎉 [${commName}] 최소 3회 의무 모임 이행을 완료하셨습니다!`
        : `(${totalCompleted}/3회 완료 - 앞으로 ${3 - totalCompleted}회의 모임이 더 필요합니다)`;

      showToast(`모임 결과 보고서가 Supabase에 성공적으로 게시되었습니다! ${requirementMsg}`, "success");

      // 폼 초기화
      el.reportTitle.value = "";
      el.editorContent.innerHTML = "";
      state.attachedFiles = [];
      renderAttachedFiles();
      updateCharCount();
    }

    // 최신 데이터 다시 로드
    await loadAllDataFromSupabase();
    switchView('list');

  } catch (err) {
    console.error("[Supabase Publish Error]", err);
    showToast("Supabase 저장 중 오류 발생: " + err.message, "warn");
  } finally {
    el.btnPublish.disabled = false;
    el.btnPublish.textContent = state.editingReportId ? "수정 완료 (저장)" : "게시하기";
  }
}

// 보고서 수정 모드 시작
function startEditReport(reportId) {
  const rep = state.reports.find(r => r.id === reportId);
  if (!rep) {
    showToast("수정할 보고서를 찾을 수 없습니다.", "warn");
    return;
  }

  state.editingReportId = reportId;

  // 폼 타이틀 및 버튼 변경
  if (el.formMainTitle) {
    el.formMainTitle.innerHTML = `모임 결과 보고서 수정 <span style="font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:12px; background:#dbeafe; color:#1d4ed8; vertical-align:middle; margin-left:8px; border:1px solid #bfdbfe;">수정 모드</span>`;
  }
  if (el.formSubTitle) {
    el.formSubTitle.textContent = `[${rep.community_name}]의 ${rep.meeting_round}회차 보고서 내용을 수정합니다.`;
  }
  el.btnPublish.textContent = "수정 완료 (저장)";
  if (el.btnCancelEdit) el.btnCancelEdit.style.display = "inline-flex";

  // 작성/수정 폼 뷰로 전환
  switchView('write');

  // 데이터 폼에 채우기
  selectCommunity(rep.community_id);
  setMeetingRound(rep.meeting_round);
  el.reportTitle.value = rep.title || "";
  el.meetingDate.value = rep.meeting_date || "";
  el.meetingLocation.value = rep.location || "";

  state.attendees = Array.isArray(rep.attendees) ? [...rep.attendees] : [];
  renderAttendees();

  el.editorContent.innerHTML = rep.content || "";
  updateCharCount();

  state.keywords = Array.isArray(rep.keywords) ? [...rep.keywords] : [];
  renderKeywords();

  state.attachedFiles = Array.isArray(rep.files) ? rep.files.map(f => ({
    name: f.name,
    size: f.size,
    dataUrl: f.storageUrl || f.dataUrl,
    storageUrl: f.storageUrl || null
  })) : [];
  renderAttachedFiles();

  // 보관함 닫기 및 폼 상단 스크롤 이동
  closeArchiveModal();
  const formCard = document.querySelector('.form-card');
  if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

  showToast(`'${rep.title}' 보고서를 수정 모드로 불러왔습니다.`, "info");
}

// 수정 모드 취소
function cancelEditReport() {
  state.editingReportId = null;

  if (el.formMainTitle) {
    el.formMainTitle.textContent = "모임 결과 보고서 작성";
  }
  if (el.formSubTitle) {
    el.formSubTitle.textContent = "연구 모임의 주요 내용과 결과를 공유해주세요.";
  }
  el.btnPublish.textContent = "게시하기";
  if (el.btnCancelEdit) el.btnCancelEdit.style.display = "none";

  // 폼 초기화
  el.reportTitle.value = "";
  el.editorContent.innerHTML = "";
  state.attachedFiles = [];
  renderAttachedFiles();
  updateCharCount();

  showToast("수정 모드가 취소되었습니다.", "info");
  switchView('list');
}

// 14. 미리보기 모달
function openPreviewModal() {
  const comm = state.communities.find(c => c.id === state.activeCommunityId);
  const commName = comm ? comm.name : "미지정 커뮤니티";
  const title = el.reportTitle.value.trim() || "(제목 없음)";
  const dateStr = el.meetingDate.value ? el.meetingDate.value.replace("T", " ") : "일시 미지정";
  const loc = el.meetingLocation.value.trim() || "장소 미기재";
  const content = el.editorContent.innerHTML || "<p style='color:#94a3b8'>작성된 내용이 없습니다.</p>";

  const attendeesHtml = state.attendees.length > 0
    ? state.attendees.map(a => `<span class="tag-chip">${a}</span>`).join(" ")
    : "<span style='color:#94a3b8'>등록된 참석자가 없습니다.</span>";

  const keywordsHtml = state.keywords.length > 0
    ? state.keywords.map(k => `<span class="tag-chip">#${k}</span>`).join(" ")
    : "<span style='color:#94a3b8'>등록된 키워드가 없습니다.</span>";

  const galleryHtml = state.attachedFiles.length > 0
    ? `<div class="preview-gallery">${state.attachedFiles.map(f => {
        const src = f.storageUrl || f.dataUrl;
        return `<img src="${src}" alt="${f.name}" title="${f.name} (클릭하여 원본 보기)" style="cursor:pointer;" onclick="openLightbox('${src}', '${f.name}')">`;
      }).join("")}</div>`
    : "<span style='color:#94a3b8'>첨부된 사진이 없습니다.</span>";

  el.previewModalBody.innerHTML = `
    <div>
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span class="archive-round-badge">${state.selectedRound}회차 모임</span>
        <span style="font-size:0.875rem; color:#475569; font-weight:600;">${commName}</span>
      </div>
      <h2 style="font-size:1.375rem; font-weight:700; color:#0f172a; margin-bottom:12px;">${title}</h2>
    </div>

    <div class="preview-meta-grid">
      <div class="meta-item">
        <span class="meta-label">모임 일시</span>
        <span class="meta-value">${dateStr}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">모임 장소</span>
        <span class="meta-value">${loc}</span>
      </div>
      <div class="meta-item" style="grid-column: 1 / -1;">
        <span class="meta-label">참석자 명단</span>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">${attendeesHtml}</div>
      </div>
    </div>

    <div>
      <span class="meta-label" style="display:block; margin-bottom:6px;">모임 내용 및 결과</span>
      <div class="preview-content-box">${content}</div>
    </div>

    <div>
      <span class="meta-label" style="display:block; margin-bottom:6px;">첨부 사진 (${state.attachedFiles.length}) <small style="color:#64748b; font-weight:normal;">(클릭 시 확대)</small></span>
      ${galleryHtml}
    </div>

    <div>
      <span class="meta-label" style="display:block; margin-bottom:6px;">관련 키워드</span>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">${keywordsHtml}</div>
    </div>
  `;

  el.previewModal.classList.add("open");
}

function closePreviewModal() {
  el.previewModal.classList.remove("open");
}

// 15. 보고서 보관함 모달 & Supabase 삭제
function openArchiveModal() {
  renderArchiveList();
  el.archiveModal.classList.add("open");
}

function closeArchiveModal() {
  el.archiveModal.classList.remove("open");
}

function updateArchiveCounter() {
  el.submittedCount.textContent = state.reports.length;
}

function renderArchiveList() {
  el.archiveListContainer.innerHTML = "";

  if (state.reports.length === 0) {
    el.archiveListContainer.innerHTML = `
      <div style="text-align:center; padding:40px; color:#94a3b8;">
        Supabase에 등록된 모임 결과 보고서가 없습니다.
      </div>
    `;
    return;
  }

  state.reports.forEach((rep) => {
    const card = document.createElement("div");
    card.className = "archive-card";

    const dateStr = rep.meeting_date ? rep.meeting_date.replace("T", " ") : "";
    const attendeesList = Array.isArray(rep.attendees) ? rep.attendees.join(", ") : "";
    const keywordsList = Array.isArray(rep.keywords) ? rep.keywords : [];
    const filesList = Array.isArray(rep.files) ? rep.files : [];

    const photosHtml = filesList.length > 0
      ? `<div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
          ${filesList.map(f => {
            const src = f.storageUrl || f.dataUrl;
            return `<img src="${src}" alt="${f.name}" style="width:48px; height:48px; object-fit:cover; border-radius:6px; cursor:pointer; border:1px solid #cbd5e1;" onclick="openLightbox('${src}', '${f.name}')" title="${f.name} (클릭 시 확대)">`;
          }).join("")}
        </div>`
      : "";

    card.innerHTML = `
      <div class="archive-card-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="archive-round-badge">${rep.meeting_round}회차 모임</span>
          <span style="font-weight:700; color:#2563eb; font-size:0.875rem;">${rep.community_name}</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" class="btn btn-outline" style="padding:4px 10px; font-size:0.75rem; color:#059669; border-color:#a7f3d0; background:#f0fdf4;" data-pdf="${rep.id}">PDF</button>
          <button type="button" class="btn btn-outline" style="padding:4px 10px; font-size:0.75rem; color:#2563eb; border-color:#93c5fd; background:#f0f7ff;" data-edit="${rep.id}">수정</button>
          <button type="button" class="btn btn-outline" style="padding:4px 10px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;" data-del="${rep.id}">삭제</button>
        </div>
      </div>
      <div class="archive-title">${rep.title}</div>
      <div class="archive-meta">
        <span>📅 ${dateStr}</span>
        <span>📍 ${rep.location || '장소 미기재'}</span>
        <span>👥 참석: ${attendeesList || '참석자 없음'}</span>
      </div>
      <div style="font-size:0.875rem; color:#475569; max-height:60px; overflow:hidden; text-overflow:ellipsis;">
        ${(rep.content || '').replace(/<[^>]*>?/gm, ' ')}
      </div>
      ${photosHtml}
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
        ${keywordsList.map(k => `<span class="tag-chip" style="font-size:0.75rem; padding:2px 8px;">#${k}</span>`).join("")}
      </div>
    `;

    // PDF 다운로드 버튼 클릭
    card.querySelector(`[data-pdf="${rep.id}"]`).addEventListener("click", () => {
      downloadReportPDF(rep);
    });

    // 수정 버튼 클릭
    card.querySelector(`[data-edit="${rep.id}"]`).addEventListener("click", () => {
      startEditReport(rep.id);
    });

    // 삭제 버튼 클릭 -> 비밀번호 확인 모달 호출
    card.querySelector(`[data-del="${rep.id}"]`).addEventListener("click", () => {
      openDeleteModal(rep.id, rep.title);
    });

    el.archiveListContainer.appendChild(card);
  });
}

// 15-1. 컨텐츠 삭제 비밀번호 확인 모달 (비밀번호: 0218)
function openDeleteModal(reportId, reportTitle) {
  state.pendingDeleteReportId = reportId;
  if (el.deleteTargetTitle) {
    el.deleteTargetTitle.textContent = `"${reportTitle || '선택한 보고서'}"`;
  }
  if (el.deletePasswordInput) {
    el.deletePasswordInput.value = "";
    el.deletePasswordInput.style.borderColor = "#cbd5e1";
  }
  if (el.deletePasswordError) {
    el.deletePasswordError.style.display = "none";
  }
  if (el.deleteConfirmModal) {
    el.deleteConfirmModal.classList.add("open");
    setTimeout(() => {
      if (el.deletePasswordInput) el.deletePasswordInput.focus();
    }, 120);
  }
}

function closeDeleteModal() {
  state.pendingDeleteReportId = null;
  if (el.deleteConfirmModal) {
    el.deleteConfirmModal.classList.remove("open");
  }
  if (el.deletePasswordInput) {
    el.deletePasswordInput.value = "";
  }
  if (el.deletePasswordError) {
    el.deletePasswordError.style.display = "none";
  }
}

async function executeReportDelete() {
  if (!state.pendingDeleteReportId) return;

  const enteredPw = el.deletePasswordInput ? el.deletePasswordInput.value.trim() : "";
  if (enteredPw !== DELETE_PASSWORD) {
    if (el.deletePasswordError) {
      el.deletePasswordError.style.display = "block";
      el.deletePasswordError.textContent = "✕ 비밀번호가 올바르지 않습니다. 다시 입력해주세요.";
    }
    if (el.deletePasswordInput) {
      el.deletePasswordInput.style.borderColor = "#dc2626";
      el.deletePasswordInput.focus();
      el.deletePasswordInput.select();
    }
    showToast("삭제 비밀번호가 일치하지 않습니다.", "warn");
    return;
  }

  const reportId = state.pendingDeleteReportId;
  const rep = state.reports.find(r => r.id === reportId);
  const repTitle = rep ? rep.title : "보고서";

  try {
    if (el.btnConfirmDelete) {
      el.btnConfirmDelete.disabled = true;
      el.btnConfirmDelete.textContent = "삭제 처리 중...";
    }

    // 1. Supabase Storage 파일 정리
    if (rep && Array.isArray(rep.files)) {
      for (const file of rep.files) {
        if (file.storagePath) {
          try {
            await state.supabase.storage.from('ai-community-photos').remove([file.storagePath]);
          } catch (storageErr) {
            console.warn("Storage delete warn:", storageErr);
          }
        }
      }
    }

    // 2. Supabase DB 레코드 삭제
    const { error } = await state.supabase
      .from('ai_community_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;

    closeDeleteModal();
    showToast(`'${repTitle}' 보고서가 Supabase에서 안전하게 삭제되었습니다.`, "info");
    await loadAllDataFromSupabase();

    // 보관함 모달이 열려있으면 목록 갱신
    if (el.archiveModal && el.archiveModal.classList.contains("open")) {
      renderArchiveList();
    }
  } catch (err) {
    console.error("[Delete Error]", err);
    showToast("삭제 실패: " + err.message, "warn");
  } finally {
    if (el.btnConfirmDelete) {
      el.btnConfirmDelete.disabled = false;
      el.btnConfirmDelete.textContent = "삭제 확인";
    }
  }
}

// 15-2. 현재 작성 폼의 입력 데이터를 보고서 객체 형식으로 추출 (미리보기 등에서 PDF 다운로드 시 활용)
function getFormDataAsReport() {
  const comm = state.communities.find(c => c.id === state.activeCommunityId) || {};
  return {
    id: state.editingReportId || 'draft',
    community_id: state.activeCommunityId,
    community_name: comm.name || "AI 커뮤니티",
    meeting_round: state.selectedRound,
    title: (el.reportTitle && el.reportTitle.value.trim()) || `${comm.name || '커뮤니티'} ${state.selectedRound}회차 모임 결과 보고서`,
    meeting_date: (el.meetingDate && el.meetingDate.value) || "",
    location: (el.meetingLocation && el.meetingLocation.value.trim()) || "장소 미기재",
    attendees: Array.isArray(state.attendees) ? [...state.attendees] : [],
    content: (el.editorContent && el.editorContent.innerHTML) || "",
    keywords: Array.isArray(state.keywords) ? [...state.keywords] : [],
    files: Array.isArray(state.attachedFiles) ? [...state.attachedFiles] : [],
    created_at: new Date().toISOString()
  };
}

// 15-3. 공식 서식 A4 보고서 PDF 다운로드 기능
async function downloadReportPDF(rep) {
  if (!rep) return;

  const comm = state.communities.find(c => c.id === Number(rep.community_id)) || {};
  const commName = rep.community_name || comm.name || "AI 커뮤니티";
  const commRepresentative = comm.representative || (Array.isArray(rep.attendees) && rep.attendees[0]) || "대표자";
  const commProject = comm.project || "AI 커뮤니티 활동지원 프로젝트";
  const commType = comm.type || "활동";
  const roundNum = rep.meeting_round || 1;
  const dateStr = rep.meeting_date ? rep.meeting_date.replace("T", " ") : "일시 미기재";
  const attendeesList = Array.isArray(rep.attendees) ? rep.attendees : [];
  const keywordsList = Array.isArray(rep.keywords) ? rep.keywords : [];
  const filesList = Array.isArray(rep.files) ? rep.files : [];
  const submitDateStr = new Date(rep.created_at || Date.now()).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  showToast(`[${commName}] ${roundNum}회차 보고서 PDF 생성 중...`, "info");

  // 사진 갤러리 HTML
  const photosHtml = filesList.length > 0
    ? `
      <div style="margin-top: 20px; page-break-inside: avoid;">
        <h3 style="font-size: 15px; font-weight: 700; color: #111827; border-left: 4px solid #ea580c; padding-left: 8px; margin: 0 0 10px 0;">
          모임 현장 사진 (${filesList.length}건)
        </h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          ${filesList.map(f => {
            const src = f.storageUrl || f.dataUrl;
            return `
              <div style="border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; background: #ffffff; text-align: center; padding: 6px;">
                <img src="${src}" crossorigin="anonymous" style="width: 100%; height: 160px; object-fit: cover; border-radius: 2px; display: block;">
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `
    : "";

  // PDF용 임시 렌더링 컨테이너 생성
  const pdfWrapper = document.createElement("div");
  pdfWrapper.style.position = "fixed";
  pdfWrapper.style.left = "-9999px";
  pdfWrapper.style.top = "0";
  pdfWrapper.style.width = "794px"; // A4 가로 픽셀 비율 (~210mm at 96dpi)
  pdfWrapper.style.background = "#ffffff";
  pdfWrapper.style.color = "#111827";
  pdfWrapper.style.fontFamily = "'Pretendard', -apple-system, sans-serif";
  pdfWrapper.style.padding = "36px 40px";
  pdfWrapper.style.boxSizing = "border-box";
  pdfWrapper.style.zIndex = "-1000";

  pdfWrapper.innerHTML = `
    <!-- 상단 공식 기관 헤더 -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 22px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="logo.png" style="height: 36px; width: auto; object-fit: contain;">
        <span style="font-size: 14px; color: #4b5563; font-weight: 700;">2026 AI 커뮤니티 활동지원 사업</span>
      </div>
      <div style="font-size: 12px; color: #9ca3af; font-weight: 600;">서식 제2호 [모임 결과 보고서]</div>
    </div>

    <!-- 문서 메인 제목 -->
    <div style="text-align: center; margin: 26px 0 30px 0;">
      <h1 style="font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin: 0 0 8px 0;">
        AI 커뮤니티 모임 결과 보고서 (${roundNum}회차)
      </h1>
      <p style="font-size: 15px; color: #4b5563; margin: 0; font-weight: 600;">
        [${commName}] - ${rep.title}
      </p>
    </div>

    <!-- 1. 기본 개요 테이블 -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <th style="width: 18%; background: #f3f4f6; border: 1px solid #d1d5db; padding: 9px 10px; text-align: center; font-weight: 700; color: #374151;">커뮤니티명</th>
        <td style="width: 32%; border: 1px solid #d1d5db; padding: 9px 12px; color: #111827; font-weight: 700;">${commName} <span style="font-weight:normal; font-size:12px; color:#4b5563;">(${commType})</span></td>
        <th style="width: 18%; background: #f3f4f6; border: 1px solid #d1d5db; padding: 9px 10px; text-align: center; font-weight: 700; color: #374151;">대 표 자</th>
        <td style="width: 32%; border: 1px solid #d1d5db; padding: 9px 12px; color: #111827;">${commRepresentative}</td>
      </tr>
      <tr>
        <th style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 9px 10px; text-align: center; font-weight: 700; color: #374151;">지원 프로젝트</th>
        <td colspan="3" style="border: 1px solid #d1d5db; padding: 9px 12px; color: #111827;">${commProject}</td>
      </tr>
      <tr>
        <th style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 9px 10px; text-align: center; font-weight: 700; color: #374151;">모임 일시</th>
        <td style="border: 1px solid #d1d5db; padding: 9px 12px; color: #111827;">${dateStr}</td>
        <th style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 9px 10px; text-align: center; font-weight: 700; color: #374151;">모임 장소</th>
        <td style="border: 1px solid #d1d5db; padding: 9px 12px; color: #111827;">${rep.location || '장소 미기재'}</td>
      </tr>
      <tr>
        <th style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 9px 10px; text-align: center; font-weight: 700; color: #374151;">참석자 (${attendeesList.length}명)</th>
        <td colspan="3" style="border: 1px solid #d1d5db; padding: 9px 12px; color: #111827;">
          ${attendeesList.join(', ') || '참석자 없음'}
        </td>
      </tr>
      <tr>
        <th style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 9px 10px; text-align: center; font-weight: 700; color: #374151;">관련 키워드</th>
        <td colspan="3" style="border: 1px solid #d1d5db; padding: 9px 12px; color: #2563eb; font-weight: 600;">
          ${keywordsList.map(k => '#' + k).join(' ') || '키워드 없음'}
        </td>
      </tr>
    </table>

    <!-- 2. 모임 활동 및 결과 본문 -->
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 15px; font-weight: 700; color: #111827; border-left: 4px solid #ea580c; padding-left: 8px; margin: 0 0 10px 0;">
        모임 활동 및 연구 결과 내용
      </h3>
      <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 18px 20px; background: #fafafa; font-size: 13.5px; line-height: 1.8; min-height: 140px;">
        ${rep.content || '<p style="color:#9ca3af">작성된 내용이 없습니다.</p>'}
      </div>
    </div>

    <!-- 3. 현장 사진 -->
    ${photosHtml}

    <!-- 4. 하단 공식 제출 및 서명 박스 -->
    <div style="margin-top: 36px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px; page-break-inside: avoid;">
      <p style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">
        위와 같이 2026년 AI 커뮤니티 활동지원 정기 모임 결과 보고서를 제출합니다.
      </p>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 22px;">
        ${submitDateStr}
      </p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 30px; font-size: 14px; font-weight: 700; color: #111827;">
        <span>제출자 : <b>${commName}</b> 대표 <b>${commRepresentative}</b></span>
        <span style="border: 1px solid #9ca3af; padding: 3px 12px; border-radius: 4px; font-size: 12px; color: #6b7280; font-weight: normal;">(서명 또는 인)</span>
      </div>
      <div style="margin-top: 28px; font-size: 17px; font-weight: 800; color: #ea580c; letter-spacing: 2px;">
        성 남 미 디 어 센 터 귀 하
      </div>
    </div>
  `;

  document.body.appendChild(pdfWrapper);

  const cleanCommName = commName.replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `[${cleanCommName}]_${roundNum}회차_모임결과보고서.pdf`;

  if (typeof window.html2pdf !== 'undefined') {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await window.html2pdf().set(opt).from(pdfWrapper).save();
      showToast(`'${fileName}' 다운로드가 완료되었습니다!`, "success");
    } catch (err) {
      console.warn("html2pdf 저장 중 오류 발생, 인쇄 모드로 대체합니다:", err);
      printFallback(pdfWrapper.innerHTML, fileName);
    } finally {
      pdfWrapper.remove();
    }
  } else {
    // CDN 미로드 시 브라우저 인쇄(PDF 저장) 창으로 대체
    printFallback(pdfWrapper.innerHTML, fileName);
    pdfWrapper.remove();
  }
}

// 인쇄 창(PDF로 저장) 폴백 함수
function printFallback(htmlContent, title) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast("브라우저 팝업이 차단되었습니다. 팝업을 허용해주세요.", "warn");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 24px; font-family: 'Pretendard', sans-serif; background: #fff; }
        @media print {
          body { padding: 0; }
          @page { size: A4; margin: 12mm; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// 16. 예시 데이터 자동 입력 (데모 기능)
function fillDemoData() {
  const comm = state.communities.find(c => c.id === state.activeCommunityId) || state.communities[0];
  if (!comm) return;

  const count = getCommunityMeetingCount(comm.id);
  const round = Math.min(count + 1, 3);
  setMeetingRound(round);

  el.reportTitle.value = `${comm.name} ${round}회차 AI 프로젝트 정기 연구 모임 및 성과 점검`;
  el.meetingLocation.value = "성남시 글로벌융합센터 3층 대회의실";
  state.attendees = [comm.representative, "김연구", "이엔지니어", "박기획"];
  renderAttendees();

  el.editorContent.innerHTML = `
    <h3>1. 모임 개요 및 추진 배경</h3>
    <p>본 모임은 <b>${comm.name}</b>의 2026 커뮤니티 지원사업 선정 프로젝트인 <i>[${comm.project}]</i>의 ${round}회차 정기 연구 모임입니다.</p>
    <br>
    <h3>2. 주요 연구 및 진행 내용</h3>
    <ul>
      <li>AI 모델 프롬프트 최적화 및 결과물 퀄리티 검증 진행</li>
      <li>참여자 간 개별 작업물 크로스 리뷰 및 피드백 공유</li>
      <li>성남 지역 시민 참여형 콘텐츠로 확장하기 위한 세부 계획 수립</li>
    </ul>
    <br>
    <blockquote>"목표했던 핵심 기능 구현을 완료하였으며, 다음 회차에서는 최종 발표 및 시민 공유회를 집중 준비할 예정입니다."</blockquote>
    <br>
    <h3>3. 다음 계획 (Next Step)</h3>
    <p>최소 3회 의무 요건 달성에 맞추어 최종 결과물 아카이빙 및 시연 준비를 완료할 계획입니다.</p>
  `;
  updateCharCount();

  state.keywords = [comm.name.replace(/\s+/g, ""), `${round}회차`, "AI프로젝트", "성과공유"];
  renderKeywords();

  // 예시 회의 현장 사진 1건 자동 첨부
  state.attachedFiles = [
    {
      name: `${comm.name}_${round}회차_연구회의.png`,
      size: "245.8 KB",
      dataUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%232563eb'/%3E%3Crect x='20' y='20' width='560' height='360' rx='12' fill='%23ffffff'/%3E%3Ctext x='50%25' y='42%25' font-size='22' font-weight='bold' fill='%231e293b' text-anchor='middle' font-family='sans-serif'%3E${encodeURIComponent(comm.name + ' ' + round + '회차 정기 연구모임')}%3C/text%3E%3Ctext x='50%25' y='55%25' font-size='15' fill='%2364748b' text-anchor='middle' font-family='sans-serif'%3E${encodeURIComponent(comm.project)}%3C/text%3E%3Ctext x='50%25' y='68%25' font-size='13' font-weight='600' fill='%23059669' text-anchor='middle' font-family='sans-serif'%3ESupabase Cloud Storage Attached Photo%3C/text%3E%3C/svg%3E`,
      storageUrl: null
    }
  ];
  renderAttachedFiles();

  showToast(`[${comm.name}]의 ${round}회차 예시 내용 및 사진이 첨부되었습니다!`, "info");
}

// 17. 이벤트 리스너 설정
function setupEventListeners() {
  // Supabase 실시간 새로고침 버튼 (헤더 뱃지 클릭)
  if (el.supabaseStatusBadge) {
    el.supabaseStatusBadge.addEventListener("click", async () => {
      showToast("Supabase 최신 데이터를 동기화하는 중...", "info");
      await loadAllDataFromSupabase();
      showToast("Supabase 데이터 동기화 완료!", "success");
    });
  }

  // 커뮤니티 드롭다운 선택 시 연동
  el.communitySelect.addEventListener("change", () => {
    if (el.communitySelect.value) {
      selectCommunity(el.communitySelect.value);
    }
  });

  // 모임 회차 선택 (1회차, 2회차, 3회차, 4회차+)
  el.roundSelectorGroup.querySelectorAll(".round-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      setMeetingRound(btn.dataset.round);
    });
  });

  // 참석자 추가
  el.btnAddAttendee.addEventListener("click", () => addAttendee(el.attendeeInput.value));
  el.attendeeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAttendee(el.attendeeInput.value);
    }
  });

  // 키워드 추가
  el.keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword(el.keywordInput.value);
    }
  });

  // 파일 업로드 (드래그 앤 드롭 & 파일 선택)
  el.btnSelectFile.addEventListener("click", () => el.fileInput.click());
  el.uploadDropzone.addEventListener("click", (e) => {
    if (e.target !== el.btnSelectFile) {
      el.fileInput.click();
    }
  });

  el.fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    el.fileInput.value = "";
  });

  el.uploadDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.uploadDropzone.classList.add("dragover");
  });

  el.uploadDropzone.addEventListener("dragleave", () => {
    el.uploadDropzone.classList.remove("dragover");
  });

  el.uploadDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    el.uploadDropzone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });

  // 임시저장
  el.btnDraftSave.addEventListener("click", saveDraft);

  // 미리보기 모달
  el.btnPreview.addEventListener("click", openPreviewModal);
  el.btnClosePreview.addEventListener("click", closePreviewModal);
  el.btnClosePreviewFooter.addEventListener("click", closePreviewModal);
  el.btnPublishFromPreview.addEventListener("click", () => {
    closePreviewModal();
    publishReport();
  });
  if (el.btnDownloadPreviewPdf) {
    el.btnDownloadPreviewPdf.addEventListener("click", () => {
      downloadReportPDF(getFormDataAsReport());
    });
  }

  // 게시하기
  el.btnPublish.addEventListener("click", publishReport);

  // 데모 채우기
  el.btnDemoFill.addEventListener("click", fillDemoData);

  // 보관함 모달
  el.btnViewArchive.addEventListener("click", openArchiveModal);
  el.btnCloseArchive.addEventListener("click", closeArchiveModal);
  el.btnCloseArchiveFooter.addEventListener("click", closeArchiveModal);

  // 수정 취소
  if (el.btnCancelEdit) {
    el.btnCancelEdit.addEventListener("click", cancelEditReport);
  }

  // 뷰 전환 (목록 피드 <-> 작성 폼)
  if (el.tabBtnList) {
    el.tabBtnList.addEventListener("click", () => switchView('list'));
  }
  if (el.tabBtnWrite) {
    el.tabBtnWrite.addEventListener("click", () => {
      cancelEditReport(); // 신규 작성 모드로 열기
      switchView('write');
    });
  }
  if (el.btnOpenWrite) {
    el.btnOpenWrite.addEventListener("click", () => {
      cancelEditReport();
      switchView('write');
    });
  }
  if (el.btnEmptyCreate) {
    el.btnEmptyCreate.addEventListener("click", () => {
      cancelEditReport();
      switchView('write');
    });
  }
  if (el.btnBackToList) {
    el.btnBackToList.addEventListener("click", () => switchView('list'));
  }
  if (el.btnDemoFillHeader) {
    el.btnDemoFillHeader.addEventListener("click", () => {
      switchView('write');
      fillDemoData();
    });
  }

  // 회차 필터 버튼 (전체 / 1회차 / 2회차 / 3회차 / 4회차+)
  if (el.roundFilterGroup) {
    el.roundFilterGroup.querySelectorAll(".round-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        el.roundFilterGroup.querySelectorAll(".round-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.currentFilterRound = btn.dataset.filter;
        renderPostFeed();
      });
    });
  }

  // 컨텐츠 삭제 비밀번호 확인 모달 이벤트
  if (el.btnCloseDeleteModal) el.btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
  if (el.btnCancelDelete) el.btnCancelDelete.addEventListener("click", closeDeleteModal);
  if (el.btnConfirmDelete) el.btnConfirmDelete.addEventListener("click", executeReportDelete);
  if (el.deletePasswordInput) {
    el.deletePasswordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        executeReportDelete();
      }
    });
    el.deletePasswordInput.addEventListener("input", () => {
      if (el.deletePasswordError) el.deletePasswordError.style.display = "none";
      if (el.deletePasswordInput) el.deletePasswordInput.style.borderColor = "#cbd5e1";
    });
  }
  if (el.deleteConfirmModal) {
    el.deleteConfirmModal.addEventListener("click", (e) => {
      if (e.target === el.deleteConfirmModal) closeDeleteModal();
    });
  }

  // 사진 확대 라이트박스 닫기
  const btnCloseLightbox = document.getElementById("btnCloseLightbox");
  if (btnCloseLightbox) btnCloseLightbox.addEventListener("click", closeLightbox);
  const lightboxModal = document.getElementById("lightboxModal");
  if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeDeleteModal();
    }
  });
}

// 전역 바인딩 (인라인 onclick 지원)
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.downloadReportPDF = downloadReportPDF;

// 토스트 알림 함수
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  el.toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// 앱 시작
document.addEventListener("DOMContentLoaded", init);
