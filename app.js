// 북마크 데이터 저장소 (LocalStorage 사용)
let bookmarks = [];

// DOM 요소 선택
const bookmarkForm = document.getElementById('bookmarkForm');
const bookmarksList = document.getElementById('bookmarksList');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const favoriteFilter = document.getElementById('favoriteFilter');
const sortSelect = document.getElementById('sortSelect');
const bookmarkCount = document.getElementById('bookmarkCount');
const emptyState = document.getElementById('emptyState');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
    displayBookmarks();
    updateBookmarkCount();
});

// LocalStorage에서 북마크 불러오기
function loadBookmarks() {
    const stored = localStorage.getItem('bookmarks');
    if (stored) {
        bookmarks = JSON.parse(stored);
        // 기존 데이터에 isFavorite 속성이 없으면 추가 (마이그레이션)
        bookmarks = bookmarks.map(bookmark => ({
            ...bookmark,
            isFavorite: bookmark.isFavorite !== undefined ? bookmark.isFavorite : false
        }));
    }
}

// LocalStorage에 북마크 저장하기
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// 북마크 추가 폼 제출 이벤트
bookmarkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addBookmark();
});

// 북마크 추가 함수
function addBookmark() {
    const title = document.getElementById('bookmarkTitle').value.trim();
    const url = document.getElementById('bookmarkUrl').value.trim();
    const category = document.getElementById('bookmarkCategory').value;
    const description = document.getElementById('bookmarkDescription').value.trim();

    // 유효성 검사
    if (!title || !url || !category) {
        alert('제목, URL, 카테고리는 필수 입력 항목입니다.');
        return;
    }

    // 새 북마크 객체 생성
    const newBookmark = {
        id: Date.now().toString(), // 간단한 ID 생성 (timestamp 사용)
        title,
        url,
        category,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false
    };

    // 북마크 배열에 추가
    bookmarks.push(newBookmark);

    // LocalStorage에 저장
    saveBookmarks();

    // 폼 초기화
    bookmarkForm.reset();

    // 화면 갱신
    displayBookmarks();
    updateBookmarkCount();

    // 성공 메시지
    alert('북마크가 추가되었습니다!');
}

// 북마크 목록 표시 함수
function displayBookmarks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedFavoriteFilter = favoriteFilter.value;
    const sortMethod = sortSelect.value;

    // 필터링
    let filtered = bookmarks.filter(bookmark => {
        const matchesSearch =
            bookmark.title.toLowerCase().includes(searchTerm) ||
            bookmark.url.toLowerCase().includes(searchTerm) ||
            bookmark.description.toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === '전체' || bookmark.category === selectedCategory;

        const matchesFavorite =
            selectedFavoriteFilter === 'all' ||
            (selectedFavoriteFilter === 'favorites' && bookmark.isFavorite);

        return matchesSearch && matchesCategory && matchesFavorite;
    });

    // 정렬
    filtered = sortBookmarks(filtered, sortMethod);

    // 화면에 표시
    if (filtered.length === 0) {
        bookmarksList.innerHTML = '';
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        bookmarksList.innerHTML = filtered.map(bookmark => createBookmarkCard(bookmark)).join('');
    }
}

// 북마크 카드 HTML 생성
function createBookmarkCard(bookmark) {
    const createdDate = new Date(bookmark.createdAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // 즐겨찾기 별표 아이콘 (채워진 별 / 빈 별)
    const favoriteIcon = bookmark.isFavorite ? '⭐' : '☆';

    return `
        <div class="bookmark-card">
            <div class="bookmark-header">
                <div class="bookmark-category category-${bookmark.category}">${bookmark.category}</div>
                <button class="btn-favorite" onclick="toggleFavorite('${bookmark.id}')" title="즐겨찾기">
                    ${favoriteIcon}
                </button>
            </div>
            <h3 class="bookmark-title">
                <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">${bookmark.title}</a>
            </h3>
            <div class="bookmark-url">${bookmark.url}</div>
            ${bookmark.description ? `<div class="bookmark-description">${bookmark.description}</div>` : ''}
            <div class="bookmark-date">생성일: ${createdDate}</div>
            <div class="bookmark-actions">
                <button class="btn btn-secondary" onclick="editBookmark('${bookmark.id}')">수정</button>
                <button class="btn btn-danger" onclick="deleteBookmark('${bookmark.id}')">삭제</button>
            </div>
        </div>
    `;
}

// 북마크 삭제 함수
function deleteBookmark(id) {
    if (confirm('정말로 이 북마크를 삭제하시겠습니까?')) {
        bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
        saveBookmarks();
        displayBookmarks();
        updateBookmarkCount();
    }
}

// 즐겨찾기 토글 함수
function toggleFavorite(id) {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
        bookmark.isFavorite = !bookmark.isFavorite;
        saveBookmarks();
        displayBookmarks();
    }
}

// 북마크 수정 함수 (기본 구현)
function editBookmark(id) {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;

    const newTitle = prompt('제목:', bookmark.title);
    if (newTitle === null) return; // 취소한 경우

    const newUrl = prompt('URL:', bookmark.url);
    if (newUrl === null) return;

    const newCategory = prompt('카테고리 (개발/디자인/뉴스/유틸리티/기타):', bookmark.category);
    if (newCategory === null) return;

    const newDescription = prompt('설명:', bookmark.description);
    if (newDescription === null) return;

    // 북마크 업데이트
    bookmark.title = newTitle.trim() || bookmark.title;
    bookmark.url = newUrl.trim() || bookmark.url;
    bookmark.category = newCategory.trim() || bookmark.category;
    bookmark.description = newDescription.trim();
    bookmark.updatedAt = new Date().toISOString();

    saveBookmarks();
    displayBookmarks();
    alert('북마크가 수정되었습니다!');
}

// 북마크 정렬 함수
function sortBookmarks(bookmarkArray, method) {
    const sorted = [...bookmarkArray];

    switch (method) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
        case 'category':
            return sorted.sort((a, b) => a.category.localeCompare(b.category, 'ko'));
        default:
            return sorted;
    }
}

// 북마크 개수 업데이트
function updateBookmarkCount() {
    bookmarkCount.textContent = bookmarks.length;
}

// 검색 입력 이벤트
searchInput.addEventListener('input', displayBookmarks);

// 카테고리 필터 변경 이벤트
categoryFilter.addEventListener('change', displayBookmarks);

// 즐겨찾기 필터 변경 이벤트
favoriteFilter.addEventListener('change', displayBookmarks);

// 정렬 방식 변경 이벤트
sortSelect.addEventListener('change', displayBookmarks);

// Export 기능: 북마크를 JSON 파일로 다운로드
function exportBookmarks() {
    if (bookmarks.length === 0) {
        alert('내보낼 북마크가 없습니다.');
        return;
    }

    // JSON 문자열로 변환 (보기 좋게 들여쓰기)
    const dataStr = JSON.stringify(bookmarks, null, 2);

    // Blob 생성
    const blob = new Blob([dataStr], { type: 'application/json' });

    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // 파일명: bookmarks_YYYYMMDD_HHMMSS.json
    const now = new Date();
    const filename = `bookmarks_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.json`;

    link.href = url;
    link.download = filename;

    // 클릭하여 다운로드
    document.body.appendChild(link);
    link.click();

    // 정리
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`북마크 ${bookmarks.length}개를 "${filename}" 파일로 내보냈습니다.`);
}

// Import 기능: JSON 파일 업로드하여 북마크 가져오기
function importBookmarks(event) {
    const file = event.target.files[0];
    if (!file) return;

    // JSON 파일인지 확인
    if (!file.name.endsWith('.json')) {
        alert('JSON 파일만 업로드할 수 있습니다.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // 배열인지 확인
            if (!Array.isArray(importedData)) {
                alert('올바른 북마크 파일이 아닙니다. (배열 형식이어야 합니다)');
                return;
            }

            // 데이터 유효성 검사
            const isValid = importedData.every(item =>
                item.id && item.title && item.url && item.category
            );

            if (!isValid) {
                alert('올바른 북마크 파일이 아닙니다. (필수 필드가 누락되었습니다)');
                return;
            }

            // 기존 데이터 처리 확인
            let shouldProceed = true;
            if (bookmarks.length > 0) {
                shouldProceed = confirm(
                    `현재 ${bookmarks.length}개의 북마크가 있습니다.\n` +
                    `파일의 ${importedData.length}개 북마크를 가져오면 기존 데이터에 추가됩니다.\n\n` +
                    `계속하시겠습니까?`
                );
            }

            if (!shouldProceed) {
                // 파일 input 초기화
                event.target.value = '';
                return;
            }

            // 기존 데이터에 병합 (중복 ID 체크)
            const existingIds = new Set(bookmarks.map(b => b.id));
            const newBookmarks = importedData.filter(b => !existingIds.has(b.id));

            // isFavorite 속성 마이그레이션
            const migratedBookmarks = newBookmarks.map(bookmark => ({
                ...bookmark,
                isFavorite: bookmark.isFavorite !== undefined ? bookmark.isFavorite : false
            }));

            bookmarks.push(...migratedBookmarks);
            saveBookmarks();
            displayBookmarks();
            updateBookmarkCount();

            alert(`${newBookmarks.length}개의 북마크를 가져왔습니다!\n(중복 ${importedData.length - newBookmarks.length}개 제외)`);

        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다. JSON 형식을 확인해주세요.\n\n오류: ' + error.message);
        }

        // 파일 input 초기화 (같은 파일 다시 선택 가능하도록)
        event.target.value = '';
    };

    reader.onerror = function() {
        alert('파일을 읽는 중 오류가 발생했습니다.');
        event.target.value = '';
    };

    reader.readAsText(file);
}
