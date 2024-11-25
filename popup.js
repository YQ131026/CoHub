/**
 * Website Manager - A Chrome extension for managing websites
 * @author Jesse
 * @version v1.0
 * @date 2024-11
 */

document.addEventListener('DOMContentLoaded', () => {
    // 获取页面元素
    const nameInput = document.getElementById('nameInput');
    const urlInput = document.getElementById('urlInput');
    const categoryInput = document.getElementById('categoryInput');
    const addButton = document.getElementById('addButton');
    const addToggleButton = document.getElementById('addToggleButton');
    const addSection = document.getElementById('addSection');
    const websiteList = document.getElementById('websiteList');
    const categoryTabs = document.getElementById('categoryTabs');
    const searchToggleButton = document.getElementById('searchToggleButton');
    const searchSection = document.getElementById('searchSection');
    const searchInput = document.getElementById('searchInput');
    const pagination = document.getElementById('pagination');
    const inputFeedback = document.getElementById('inputFeedback');
    const editButton = document.getElementById('editButton');
    const importButton = document.getElementById('importButton');
    const exportButton = document.getElementById('exportButton');
    const actionHeader = document.getElementById('actionHeader');
    const categoryOptions = document.getElementById('categoryOptions'); // <datalist>元素
    const updateButton = document.getElementById('updateButton'); // 更新按钮
    const updateModalElement = document.getElementById('updateModal'); // 更新模态对话框
    const updateModal = new bootstrap.Modal(updateModalElement); // 初始化模态对话框
    const remoteUrlInput = document.getElementById('newRemoteUrlInput'); // 新的远程 URL 输入框
    const remoteUpdateButton = document.getElementById('updateRemoteButton'); // 远程更新按钮
    const remoteFeedback = document.getElementById('updateFeedback'); // 远程更新反馈
    const manageRemotesButton = document.getElementById('manageRemotesButton'); // 管理远程地址按钮
    const manageRemotesModalElement = document.getElementById('manageRemotesModal'); // 管理远程地址模态对话框
    const manageRemotesModal = new bootstrap.Modal(manageRemotesModalElement); // 初始化模态对话框
    const addRemoteUrlInput = document.getElementById('addRemoteUrlInput'); // 添加远程地址输入框
    const addRemoteButton = document.getElementById('addRemoteButton'); // 添加远程地址按钮
    const addRemoteFeedback = document.getElementById('addRemoteFeedback'); // 添加远程地址反馈
    const remoteUrlList = document.getElementById('remoteUrlList'); // 远程地址列表
    const clearAllLocalButton = document.getElementById('clearAllLocalButton'); // 清空本地所有地址按钮

    let isEditing = false; // 是否处于编辑模式
    let isAdding = false;  // 是否显示添加表单
    let isSearching = false; // 是否显示搜索框
    let currentCategory = 'All'; // 当前选中的分类
    let currentPage = 1; // 当前页码
    const itemsPerPage = 10; // 每页显示的项目数量
    let websitesData = []; // 缓存的网站数据
    let remoteUrls = []; // 缓存的远程 URL 数据

    // 初始化：加载网站和远程 URL
    loadWebsites();
    loadRemoteUrls();

    // 切换搜索框的显示和隐藏
    searchToggleButton.addEventListener('click', (event) => {
      event.stopPropagation(); // 阻止事件冒泡
      isSearching = !isSearching;
      if (isSearching) {
        searchSection.style.display = 'block';
        searchInput.focus();

        // 在搜索模式下，禁用编辑和添加功能
        if (isEditing) {
          toggleEditMode(); // 退出编辑模式
        }
        editButton.disabled = true;
        addToggleButton.disabled = true;
        importButton.disabled = true;
        exportButton.disabled = true;
        updateButton.disabled = true;
        manageRemotesButton.disabled = true;
      } else {
        searchSection.style.display = 'none';
        searchInput.value = '';
        currentPage = 1;
        renderWebsiteList();
        editButton.disabled = false;
        addToggleButton.disabled = false;
        importButton.disabled = false;
        exportButton.disabled = false;
        updateButton.disabled = false;
        manageRemotesButton.disabled = false;
      }
    });

    // 当点击搜索框外部时，隐藏搜索框
    document.addEventListener('click', (event) => {
      const isClickInside = searchSection.contains(event.target) || searchToggleButton.contains(event.target);
      if (!isClickInside && isSearching) {
        isSearching = false;
        searchSection.style.display = 'none';
        searchInput.value = '';
        currentPage = 1;
        renderWebsiteList();
        editButton.disabled = false;
        addToggleButton.disabled = false;
        importButton.disabled = false;
        exportButton.disabled = false;
        updateButton.disabled = false;
        manageRemotesButton.disabled = false;
      }
    });

    // 阻止点击搜索框内部时事件冒泡到 document
    searchSection.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    // 切换添加表单的显示和隐藏
    addToggleButton.addEventListener('click', () => {
      isAdding = !isAdding;
      if (isAdding) {
        addSection.style.display = 'block';
        nameInput.focus();
      } else {
        addSection.style.display = 'none';
        nameInput.value = '';
        urlInput.value = '';
        categoryInput.value = '';
        addButton.disabled = true;
        inputFeedback.textContent = '';
      }
    });

    // 切换更新模态对话框的显示
    updateButton.addEventListener('click', () => {
      populateSelectRemoteUrl();
      remoteUrlInput.value = '';
      remoteUpdateButton.disabled = true;
      remoteFeedback.textContent = '';
      updateModal.show();
    });

    // 监听新的远程 URL 输入框的变化
    remoteUrlInput.addEventListener('input', () => {
      const url = remoteUrlInput.value.trim();
      remoteUpdateButton.disabled = !isValidUrl(url) && !selectedRemoteUrl();
      remoteFeedback.textContent = '';
    });

    // 点击远程更新按钮时导入数据
    remoteUpdateButton.addEventListener('click', () => {
      const selectedUrlId = document.getElementById('selectRemoteUrl').value;
      const newUrl = remoteUrlInput.value.trim();

      if (selectedUrlId && selectedUrlId !== 'new') {
        // 使用已选择的远程 URL
        const selectedRemote = remoteUrls.find(remote => remote.id === selectedUrlId);
        if (selectedRemote) {
          performRemoteUpdate(selectedRemote.url);
        } else {
          remoteFeedback.textContent = 'Selected remote URL not found.';
        }
      } else if (newUrl) {
        // 使用新的远程 URL
        if (!isValidUrl(newUrl)) {
          remoteFeedback.textContent = 'Please enter a valid URL.';
          return;
        }
        performRemoteUpdate(newUrl);
      } else {
        remoteFeedback.textContent = 'Please select or enter a valid URL.';
      }
    });

    // 管理远程地址按钮点击事件
    manageRemotesButton.addEventListener('click', () => {
      populateRemoteUrlList();
      addRemoteUrlInput.value = '';
      addRemoteButton.disabled = true;
      addRemoteFeedback.textContent = '';
      manageRemotesModal.show();
    });

    // 监听添加远程地址输入框的变化
    addRemoteUrlInput.addEventListener('input', () => {
      const url = addRemoteUrlInput.value.trim();
      addRemoteButton.disabled = !isValidUrl(url);
      addRemoteFeedback.textContent = '';
    });

    // 点击添加远程地址按钮时添加新的远程��址
    addRemoteButton.addEventListener('click', () => {
      const url = addRemoteUrlInput.value.trim();
      if (!isValidUrl(url)) {
        addRemoteFeedback.textContent = 'Please enter a valid URL.';
        return;
      }

      // 创建一个唯一的ID
      const newRemote = {
        id: Date.now().toString(),
        url: url
      };

      chrome.storage.sync.get(['remoteUrls'], (result) => {
        let existingRemotes = result.remoteUrls || [];
        existingRemotes.push(newRemote);
        chrome.storage.sync.set({ remoteUrls: existingRemotes }, () => {
          console.log('New remote URL added:', newRemote);
          loadRemoteUrls();
          populateSelectRemoteUrl();
          populateRemoteUrlList();
          addRemoteUrlInput.value = '';
          addRemoteButton.disabled = true;
          addRemoteFeedback.textContent = '';
        });
      });
    });

    // 加载网站列表
    function loadWebsites() {
      chrome.storage.sync.get(['websites'], (result) => {
        console.log('Retrieved websites:', result.websites);
        websitesData = result.websites || [];

        // 过滤空的或无效的条目
        websitesData = websitesData.filter(site => site && site.name && site.url);
        console.log('Filtered websites:', websitesData);

        // 渲染分类选项卡
        renderCategoryTabs();

        // 渲染分类下拉列表
        renderCategoryDatalist();

        // 渲染网站列表
        renderWebsiteList();
      });
    }

    // 渲染分类选项卡
    function renderCategoryTabs() {
      const categories = new Set(websitesData.map(site => site.category || 'Uncategorized'));
      categories.add('All'); // 添加 "All" 选项

      categoryTabs.innerHTML = '';
      categories.forEach(category => {
        const tabItem = document.createElement('li');
        tabItem.className = 'nav-item';

        const tabLink = document.createElement('a');
        tabLink.className = 'nav-link';
        if (category === currentCategory) {
          tabLink.classList.add('active');
        }
        tabLink.href = '#';
        tabLink.textContent = category;
        tabLink.addEventListener('click', (e) => {
          e.preventDefault();
          currentCategory = category;
          currentPage = 1; // 重置为第一页
          renderWebsiteList();
          renderCategoryTabs(); // 更新选项卡的激活状态
        });

        tabItem.appendChild(tabLink);
        categoryTabs.appendChild(tabItem);
      });
    }

    // 渲染分类下拉列表
    function renderCategoryDatalist() {
      const categories = new Set(websitesData.map(site => site.category || 'Uncategorized'));
      categoryOptions.innerHTML = '';

      categories.forEach(category => {
        if (category !== 'All') { // 排除 "All"
          const option = document.createElement('option');
          option.value = category;
          categoryOptions.appendChild(option);
        }
      });
    }

    // 渲染网站列表
    function renderWebsiteList() {
      let filteredWebsites = websitesData;

      // 根据搜索关键词过滤（仅 Name 和 URL）
      const searchKeyword = searchInput.value.trim().toLowerCase();
      if (isSearching && searchKeyword) { // 仅在搜索模式下应用搜索
        filteredWebsites = filteredWebsites.filter(site =>
          site.name.toLowerCase().includes(searchKeyword) ||
          site.url.toLowerCase().includes(searchKeyword)
        );
      }

      // 根据分类过滤
      if (currentCategory !== 'All') {
        filteredWebsites = filteredWebsites.filter(site => (site.category || 'Uncategorized') === currentCategory);
      }

      console.log('Filtered websites for display:', filteredWebsites);

      // 分页处理
      const totalItems = filteredWebsites.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage > totalPages) {
        currentPage = totalPages || 1;
      }
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const websitesToDisplay = filteredWebsites.slice(startIndex, endIndex);

      console.log(`Displaying websites from index ${startIndex} to ${endIndex}:`, websitesToDisplay);

      // 渲染列表
      websiteList.innerHTML = '';

      websitesToDisplay.forEach((site) => {
        if (site.name && site.url) {
          const row = document.createElement('tr');

          // 网站名称单格
          const nameCell = document.createElement('td');
          nameCell.className = 'name-cell';

          // URL 单元格
          const urlCell = document.createElement('td');
          urlCell.className = 'url-cell';

          // 分类单元格
          const categoryCell = document.createElement('td');
          categoryCell.className = 'category-cell';

          // 计算全局索引
          const globalIndex = websitesData.findIndex(existingSite => existingSite.url === site.url);
          if (globalIndex === -1) {
            console.warn('Site not found in websitesData:', site);
            return;
          }

          if (isEditing && !isSearching) {
            // 编辑模式下，且不在搜索模式时，允许编辑
            // 创建可编辑的输入字段
            const nameInputField = document.createElement('input');
            nameInputField.type = 'text';
            nameInputField.value = site.name;
            nameInputField.className = 'form-control form-control-sm';
            nameInputField.dataset.index = globalIndex;

            const urlInputField = document.createElement('input');
            urlInputField.type = 'text';
            urlInputField.value = site.url;
            urlInputField.className = 'form-control form-control-sm';
            urlInputField.dataset.index = globalIndex;

            const categoryInputField = document.createElement('input');
            categoryInputField.list = 'categoryOptions';
            categoryInputField.type = 'text';
            categoryInputField.value = site.category || '';
            categoryInputField.className = 'form-control form-control-sm';
            categoryInputField.dataset.index = globalIndex;
            categoryInputField.placeholder = 'Category';

            nameCell.appendChild(nameInputField);
            urlCell.appendChild(urlInputField);
            categoryCell.appendChild(categoryInputField);

            // 删除按钮单元格
            const actionCell = document.createElement('td');
            actionCell.className = 'action-cell';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-sm delete-button';
            deleteButton.title = 'Delete';
            deleteButton.innerHTML = '<i class="bi bi-x-circle text-danger"></i>';
            deleteButton.style.backgroundColor = 'transparent';
            deleteButton.style.border = 'none';

            deleteButton.addEventListener('click', () => {
              deleteWebsite(globalIndex);
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(nameCell);
            row.appendChild(urlCell);
            row.appendChild(categoryCell);
            row.appendChild(actionCell);
          } else {
            // 显示为只读文本
            nameCell.textContent = site.name;
            nameCell.title = site.name;

            const urlLink = document.createElement('a');
            urlLink.href = site.url;
            urlLink.target = '_blank';
            urlLink.textContent = site.url;
            urlLink.className = 'url-link';
            urlLink.title = site.url;

            urlCell.appendChild(urlLink);

            categoryCell.textContent = site.category || 'Uncategorized';

            row.appendChild(nameCell);
            row.appendChild(urlCell);
            row.appendChild(categoryCell);

            // 如果在编辑模式下，且不在搜索模式，显示删除按钮
            if (isEditing && !isSearching) {
              const actionCell = document.createElement('td');
              actionCell.className = 'action-cell';

              const deleteButton = document.createElement('button');
              deleteButton.className = 'btn btn-sm delete-button';
              deleteButton.title = 'Delete';
              deleteButton.innerHTML = '<i class="bi bi-x-circle text-danger"></i>';
              deleteButton.style.backgroundColor = 'transparent';
              deleteButton.style.border = 'none';

              deleteButton.addEventListener('click', () => {
                deleteWebsite(globalIndex);
              });

              actionCell.appendChild(deleteButton);
              row.appendChild(actionCell);
            }
          }

          websiteList.appendChild(row);
        }
      });

      // 渲染分页控件
      renderPagination(totalPages);
    }

    // 渲染分页控件
    function renderPagination(totalPages) {
      pagination.innerHTML = '';

      // 如果只有一页，不显示分页控件
      if (totalPages <= 1) {
        return;
      }

      // 创建上一页按钮
      const prevPageItem = document.createElement('li');
      prevPageItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;

      const prevPageLink = document.createElement('a');
      prevPageLink.className = 'page-link';
      prevPageLink.href = '#';
      prevPageLink.innerHTML = '&laquo;';
      prevPageLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
          currentPage--;
          renderWebsiteList();
        }
      });

      prevPageItem.appendChild(prevPageLink);
      pagination.appendChild(prevPageItem);

      // 创建页码按钮（最多显示5个页码）
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${currentPage === i ? 'active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', (e) => {
          e.preventDefault();
          currentPage = i;
          renderWebsiteList();
        });

        pageItem.appendChild(pageLink);
        pagination.appendChild(pageItem);
      }

      // 创建下一页按钮
      const nextPageItem = document.createElement('li');
      nextPageItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;

      const nextPageLink = document.createElement('a');
      nextPageLink.className = 'page-link';
      nextPageLink.href = '#';
      nextPageLink.innerHTML = '&raquo;';
      nextPageLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
          currentPage++;
          renderWebsiteList();
        }
      });

      nextPageItem.appendChild(nextPageLink);
      pagination.appendChild(nextPageItem);
    }

    // 添加网站
    function addWebsite() {
      const name = nameInput.value.trim();
      const url = urlInput.value.trim();
      const category = categoryInput.value.trim();

      if (!name || !url) {
        inputFeedback.textContent = 'Name and URL are required.';
        return;
      }

      if (!isValidUrl(url)) {
        inputFeedback.textContent = 'Please enter a valid URL.';
        return;
      }

      chrome.storage.sync.get(['websites'], (result) => {
        let websites = result.websites || [];

        // 移除空的或无效的条目
        websites = websites.filter(site => site && site.name && site.url);

        // 检查是否存在相同的 URL，若存在则覆盖
        const existingIndex = websites.findIndex(site => site.url === url);
        if (existingIndex !== -1) {
          console.log(`Overwriting existing website at index ${existingIndex}:`, websites[existingIndex]);
          websites[existingIndex] = { name, url, category };
        } else {
          console.log('Adding new website:', { name, url, category });
          websites.push({ name, url, category });
        }

        chrome.storage.sync.set({ websites }, () => {
          console.log('Websites have been updated:', websites);
          nameInput.value = '';
          urlInput.value = '';
          categoryInput.value = '';
          addButton.disabled = true;
          inputFeedback.textContent = '';
          addSection.style.display = 'none'; // 隐藏添加表单
          isAdding = false; // 更新添加状态
          loadWebsites();
        });
      });
    }

    // 删除网站
    function deleteWebsite(index) {
      if (!confirm('Are you sure you want to delete this website?')) {
        return;
      }

      chrome.storage.sync.get(['websites'], (result) => {
        let websites = result.websites || [];
        console.log('Websites before deletion:', websites);
        websites.splice(index, 1); // 删除指定索引的网站
        chrome.storage.sync.set({ websites }, () => {
          console.log('Websites after deletion:', websites);
          loadWebsites();
        });
      });
    }

    // 导出网站列表
    function exportWebsites() {
      chrome.storage.sync.get(['websites'], (result) => {
        const websites = result.websites || [];
        const dataStr = JSON.stringify(websites, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 创建临时链接以触发下载
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'websites.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      });
    }

    // 导入网站列表
    function importWebsites() {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json,application/json';
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedWebsites = JSON.parse(e.target.result);

            if (!Array.isArray(importedWebsites)) {
              alert('Invalid file format.');
              return;
            }

            chrome.storage.sync.get(['websites'], (result) => {
              let existingWebsites = result.websites || [];

              // 创建一个 Map，以 URL 为键，便于查找和覆盖
              const websiteMap = new Map();
              existingWebsites.forEach(site => {
                if (site.url) {
                  websiteMap.set(site.url, site);
                }
              });

              // 合并导入的数据，覆盖已有的 URL
              importedWebsites.forEach(site => {
                if (site.url && site.name) {
                  websiteMap.set(site.url, site);
                }
              });

              // 将合并后的数据转换为数组并保存
              const mergedWebsites = Array.from(websiteMap.values());
              chrome.storage.sync.set({ websites: mergedWebsites }, () => {
                console.log('Websites have been imported:', mergedWebsites);
                loadWebsites();
                alert('Import successful.');
              });
            });
          } catch (error) {
            alert('Failed to import. Please ensure the file is a valid JSON.');
          }
        };
        reader.readAsText(file);
      });
      fileInput.click();
    }

    // 验证 URL 格式
    function isValidUrl(string) {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    }

    // 更新添加按钮的状态
    function updateAddButtonState() {
      const name = nameInput.value.trim();
      const url = urlInput.value.trim();
      addButton.disabled = !name || !url;
      inputFeedback.textContent = '';
    }

    // 切换编辑模式
    editButton.addEventListener('click', () => {
      toggleEditMode();
    });

    // 切换编辑模式的函数
    function toggleEditMode() {
      isEditing = !isEditing;
      const editIcon = editButton.querySelector('i');

      if (isEditing) {
        editIcon.classList.remove('bi-pencil-square');
        editIcon.classList.add('bi-save');
        editButton.title = 'Save';

        // 显示操作列头
        actionHeader.style.display = '';
        // 禁用其他按钮
        searchToggleButton.disabled = true;
        addToggleButton.disabled = true;
        importButton.disabled = true;
        exportButton.disabled = true;
        updateButton.disabled = true;
        manageRemotesButton.disabled = true;

        renderWebsiteList();
      } else {
        editIcon.classList.remove('bi-save');
        editIcon.classList.add('bi-pencil-square');
        editButton.title = 'Edit';

        // 隐藏操作列头
        actionHeader.style.display = 'none';
        // 启用其他按钮
        searchToggleButton.disabled = false;
        addToggleButton.disabled = false;
        importButton.disabled = false;
        exportButton.disabled = false;
        updateButton.disabled = false;
        manageRemotesButton.disabled = false;

        // 保存编辑后的数据
        saveEditedWebsites();
      }
    }

    // 保存编辑后的网站列表
    function saveEditedWebsites() {
      const rows = websiteList.querySelectorAll('tr');
      const updatedWebsites = [...websitesData]; // 复制一份数据

      rows.forEach((row) => {
        const nameInputField = row.querySelector('.name-cell input');
        const urlInputField = row.querySelector('.url-cell input');
        const categoryInputField = row.querySelector('.category-cell input');

        if (nameInputField && urlInputField) {
          const index = parseInt(nameInputField.dataset.index, 10);
          const name = nameInputField.value.trim();
          const url = urlInputField.value.trim();
          const category = categoryInputField.value.trim();

          if (!name || !url || !isValidUrl(url)) {
            console.warn(`Skipping invalid entry at index ${index}:`, { name, url, category });
            return; // 跳过无效的条目
          }

          updatedWebsites[index] = { name, url, category };
        }
      });

      chrome.storage.sync.set({ websites: updatedWebsites }, () => {
        console.log('Websites have been saved:', updatedWebsites);
        loadWebsites();
      });
    }

    // 事件监听器
    nameInput.addEventListener('input', updateAddButtonState);
    urlInput.addEventListener('input', updateAddButtonState);
    categoryInput.addEventListener('input', updateAddButtonState);

    // 点击添加按钮时添加网站
    addButton.addEventListener('click', addWebsite);

    // 在输入框中按下回车键添加网站
    [nameInput, urlInput, categoryInput].forEach((input) => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !addButton.disabled) {
          addWebsite();
        }
      });
    });

    // 点击导出按钮时导出网站列表
    exportButton.addEventListener('click', exportWebsites);

    // 点击导入按钮时导入网站列表
    importButton.addEventListener('click', importWebsites);

    // 搜索输入框事件
    searchInput.addEventListener('input', () => {
      currentPage = 1; // 重置为第一页
      renderWebsiteList();
    });

    // 管理远程地址模态对话框的函数

    // 添加和删除远程地址
    function loadRemoteUrls() {
      chrome.storage.sync.get(['remoteUrls'], (result) => {
        remoteUrls = result.remoteUrls || [];
        populateSelectRemoteUrl();
        populateRemoteUrlList();
      });
    }

    function populateSelectRemoteUrl() {
      const selectRemoteUrl = document.getElementById('selectRemoteUrl');
      selectRemoteUrl.innerHTML = '';

      // 添加默认选项
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select a Remote URL --';
      selectRemoteUrl.appendChild(defaultOption);

      // 添加已保存的远程地址选项
      remoteUrls.forEach(remote => {
        const option = document.createElement('option');
        option.value = remote.id;
        option.textContent = remote.url;
        selectRemoteUrl.appendChild(option);
      });

      // 添加一个选项用于输入新的远程地址
      const newOption = document.createElement('option');
      newOption.value = 'new';
      newOption.textContent = '--- Enter a New Remote URL ---';
      selectRemoteUrl.appendChild(newOption);
    }

    function populateRemoteUrlList() {
      remoteUrlList.innerHTML = '';

      if (remoteUrls.length === 0) {
        const noRemotesItem = document.createElement('li');
        noRemotesItem.className = 'list-group-item';
        noRemotesItem.textContent = 'No remote URLs saved.';
        remoteUrlList.appendChild(noRemotesItem);
        return;
      }

      remoteUrls.forEach(remote => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

        const urlText = document.createElement('span');
        urlText.textContent = remote.url;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-danger';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.title = 'Delete';

        deleteButton.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this remote URL?')) {
            deleteRemoteUrl(remote.id);
          }
        });

        listItem.appendChild(urlText);
        listItem.appendChild(deleteButton);
        remoteUrlList.appendChild(listItem);
      });
    }

    function deleteRemoteUrl(id) {
      chrome.storage.sync.get(['remoteUrls'], (result) => {
        let existingRemotes = result.remoteUrls || [];
        existingRemotes = existingRemotes.filter(remote => remote.id !== id);
        chrome.storage.sync.set({ remoteUrls: existingRemotes }, () => {
          console.log(`Remote URL with ID ${id} deleted.`);
          loadRemoteUrls();
        });
      });
    }

    // 检查是否选择了已保存的远程地址
    function selectedRemoteUrl() {
      const selectRemoteUrl = document.getElementById('selectRemoteUrl');
      return selectRemoteUrl.value && selectRemoteUrl.value !== 'new';
    }

    // 执行远程更新
    function performRemoteUpdate(url) {
      if (!isValidUrl(url)) {
        remoteFeedback.textContent = 'Invalid URL format.';
        return;
      }

      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok (status: ${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          if (!Array.isArray(data)) {
            throw new Error('Invalid data format: expected an array.');
          }

          // Validate each entry
          const validData = data.filter(site => site && site.name && site.url);
          if (validData.length === 0) {
            throw new Error('No valid website entries found in the imported data.');
          }

          // 直接替换本地数据，而不是合并
          chrome.storage.sync.set({ websites: validData }, () => {
            console.log('Websites have been updated from remote URL:', validData);
            websitesData = validData; // 更新本地缓存
            loadWebsites(); // 重新加载网站列表
            updateModal.hide();
            showNotification('Update successful.');
          });
        })
        .catch(error => {
          console.error('Error updating websites from remote URL:', error);
          remoteFeedback.textContent = `Error: ${error.message}`;
        });
    }

    // 管理远程地址模态对话框相关功能

    // 添加远程地址
    function addRemoteUrl(url) {
      const newRemote = {
        id: Date.now().toString(),
        url: url
      };

      chrome.storage.sync.get(['remoteUrls'], (result) => {
        let existingRemotes = result.remoteUrls || [];
        existingRemotes.push(newRemote);
        chrome.storage.sync.set({ remoteUrls: existingRemotes }, () => {
          console.log('New remote URL added:', newRemote);
          loadRemoteUrls();
        });
      });
    }

    // 监听选择远程地址下拉菜单的变化
    document.getElementById('selectRemoteUrl').addEventListener('change', (e) => {
      const selectedValue = e.target.value;
      const newRemoteUrlInputDiv = document.querySelector('#updateModal .modal-body .mb-3:nth-child(2)');
      const newRemoteUrlInput = document.getElementById('newRemoteUrlInput');

      if (selectedValue === 'new') {
        // 显示输入新的远程地址的输入框
        newRemoteUrlInput.parentElement.style.display = 'block';
      } else {
        // 隐藏输入新的远程地址的输入框
        newRemoteUrlInput.parentElement.style.display = 'none';
        newRemoteUrlInput.value = '';
        remoteUpdateButton.disabled = !selectedValue;
      }
      remoteUpdateButton.disabled = !selectedValue && !newRemoteUrlInput.value.trim();
      remoteFeedback.textContent = '';
    });

    // 更新按钮状态根据选择和输入
    newRemoteUrlInput = document.getElementById('newRemoteUrlInput');
    newRemoteUrlInput.addEventListener('input', () => {
      const newUrl = newRemoteUrlInput.value.trim();
      const selectedValue = document.getElementById('selectRemoteUrl').value;
      if (selectedValue === 'new') {
        remoteUpdateButton.disabled = !isValidUrl(newUrl);
      }
      remoteFeedback.textContent = '';
    });

    // 加载远程 URL 数据
    function loadRemoteUrls() {
      chrome.storage.sync.get(['remoteUrls'], (result) => {
        remoteUrls = result.remoteUrls || [];
        populateSelectRemoteUrl();
        populateRemoteUrlList();
      });
    }

    // 填充更新模态对话框中的选择远程地址下拉菜单
    function populateSelectRemoteUrl() {
      const selectRemoteUrl = document.getElementById('selectRemoteUrl');
      selectRemoteUrl.innerHTML = '';

      // 添加默认选项
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select a Remote URL --';
      selectRemoteUrl.appendChild(defaultOption);

      // 添加已保存的远程地址选项
      remoteUrls.forEach(remote => {
        const option = document.createElement('option');
        option.value = remote.id;
        option.textContent = remote.url;
        selectRemoteUrl.appendChild(option);
      });

      // 添加一个选项用于输入新的远程地址
      const newOption = document.createElement('option');
      newOption.value = 'new';
      newOption.textContent = '--- Enter a New Remote URL ---';
      selectRemoteUrl.appendChild(newOption);
    }

    // 填充管理远程地址模态对话框中的列表
    function populateRemoteUrlList() {
      remoteUrlList.innerHTML = '';

      if (remoteUrls.length === 0) {
        const noRemotesItem = document.createElement('li');
        noRemotesItem.className = 'list-group-item';
        noRemotesItem.textContent = 'No remote URLs saved.';
        remoteUrlList.appendChild(noRemotesItem);
        return;
      }

      remoteUrls.forEach(remote => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

        const urlText = document.createElement('span');
        urlText.textContent = remote.url;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-danger';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.title = 'Delete';

        deleteButton.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this remote URL?')) {
            deleteRemoteUrl(remote.id);
          }
        });

        listItem.appendChild(urlText);
        listItem.appendChild(deleteButton);
        remoteUrlList.appendChild(listItem);
      });
    }

    // 删除远程地址
    function deleteRemoteUrl(id) {
      chrome.storage.sync.get(['remoteUrls'], (result) => {
        let existingRemotes = result.remoteUrls || [];
        existingRemotes = existingRemotes.filter(remote => remote.id !== id);
        chrome.storage.sync.set({ remoteUrls: existingRemotes }, () => {
          console.log(`Remote URL with ID ${id} deleted.`);
          loadRemoteUrls();
        });
      });
    }

    // 处理远程更新
    function performRemoteUpdate(url) {
      if (!isValidUrl(url)) {
        remoteFeedback.textContent = 'Invalid URL format.';
        return;
      }

      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok (status: ${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          if (!Array.isArray(data)) {
            throw new Error('Invalid data format: expected an array.');
          }

          // Validate each entry
          const validData = data.filter(site => site && site.name && site.url);
          if (validData.length === 0) {
            throw new Error('No valid website entries found in the imported data.');
          }

          // 直接替换本地数据，而不是合并
          chrome.storage.sync.set({ websites: validData }, () => {
            console.log('Websites have been updated from remote URL:', validData);
            websitesData = validData; // 更新本地缓存
            loadWebsites(); // 重新加载网站列表
            updateModal.hide();
            showNotification('Update successful.');
          });
        })
        .catch(error => {
          console.error('Error updating websites from remote URL:', error);
          remoteFeedback.textContent = `Error: ${error.message}`;
        });
    }

    // 加载远程 URL 数据
    function loadRemoteUrls() {
      chrome.storage.sync.get(['remoteUrls'], (result) => {
        remoteUrls = result.remoteUrls || [];
        populateSelectRemoteUrl();
        populateRemoteUrlList();
      });
    }

    // 添加远程地址
    function addRemoteUrl(url) {
      const newRemote = {
        id: Date.now().toString(),
        url: url
      };

      chrome.storage.sync.get(['remoteUrls'], (result) => {
        let existingRemotes = result.remoteUrls || [];
        existingRemotes.push(newRemote);
        chrome.storage.sync.set({ remoteUrls: existingRemotes }, () => {
          console.log('New remote URL added:', newRemote);
          loadRemoteUrls();
        });
      });
    }

    // 添加一个新函数来清空本地存储的网站数据
    function clearAllLocalWebsites() {
      chrome.storage.sync.set({ websites: [] }, function() {
        if (chrome.runtime.lastError) {
          console.error('Error clearing websites:', chrome.runtime.lastError);
          showNotification('Error clearing websites. Please try again.');
        } else {
          console.log('All websites have been cleared.');
          websitesData = []; // 清空本地缓存的数据
          renderWebsiteList(); // 立即重新渲染网站列表
          showNotification('All websites have been cleared.');
        }
      });
    }

    // 在适当的位置（比如 DOMContentLoaded 事件监听器中）添加以下代码
    document.getElementById('clearAllLocalButton').addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all locally stored websites? This action cannot be undone.')) {
        clearAllLocalWebsites();
      }
    });

    // 如果您还没有 showNotification 函数，可以添加这个辅助函数
    function showNotification(message) {
      const notification = document.getElementById('notification');
      if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
          notification.style.display = 'none';
        }, 3000);
      } else {
        console.error('Notification element not found');
        // 可以选择使用 alert 作为备选方案
        alert(message);
      }
    }

    // 初始化并加载网站列表和远程 URL
    loadWebsites();
    loadRemoteUrls();
});
