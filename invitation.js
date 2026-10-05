// bank: 은행명, number: 계좌번호, holder: 예금주 성함.
// 실제 계좌는 isExample: false로 설정합니다. 번호는 은행별 표시 형식으로 보관하고 복사 시 숫자만 사용합니다.
const invitationAccounts = {
  groom: [
    { role: '신랑', holder: '황두훈', bank: '우리은행', number: '1002-283-900308', isExample: false },
    { role: '신랑 아버지', holder: '황준형', bank: '우리은행', number: '1002-849-304752', isExample: false },
    { role: '신랑 어머니', holder: '최영교', bank: '국민은행', number: '105-21-0656-193', isExample: false },
  ],
  bride: [
    { role: '신부', holder: '이영서', bank: '카카오뱅크', number: '3333-16-6258140', isExample: false },
    { role: '신부 아버지', holder: '이종욱', bank: '신한은행', number: '315-04-388612', isExample: false },
    { role: '신부 어머니', holder: '심미정', bank: '신한은행', number: '110-168-407334', isExample: false },
  ],
};

(() => {
  // 추가 청첩장은 계좌번호와 예금주 원문을 유지하며 표시 이름만 바꿀 수 있습니다.
  const nameOverridesElement = document.querySelector('#account-name-overrides');
  const accountNameOverrides = nameOverridesElement ? JSON.parse(nameOverridesElement.textContent) : {};
  const weddingDate = Date.UTC(2027, 0, 10);
  const dayInMilliseconds = 86400000;
  const toast = document.querySelector('#toast');
  let toastTimer;

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function updateCountdown() {
    const koreaTime = new Date(Date.now() + 9 * 3600000);
    const today = Date.UTC(koreaTime.getUTCFullYear(), koreaTime.getUTCMonth(), koreaTime.getUTCDate());
    const days = Math.round((weddingDate - today) / dayInMilliseconds);
    const count = document.querySelector('#count');
    count.textContent = days > 0 ? `D-${days}` : days === 0 ? 'D-DAY' : `D+${Math.abs(days)}`;
    document.querySelector('.calendar-message').firstChild.textContent = days < 0 ? '두훈과 영서가 함께한 날 ' : '두훈과 영서의 결혼식까지 ';
  }
  updateCountdown();
  window.setInterval(updateCountdown, 60000);

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
        // 일부 모바일 브라우저와 로컬 파일 환경에서는 아래 방식으로 복사합니다.
      }
    }
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;font-size:16px';
    document.body.append(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    let copied;
    try { copied = document.execCommand('copy'); } finally { field.remove(); }
    if (!copied) throw new Error('Copy unavailable');
  }

  document.querySelector('#account-preview-note').hidden = !Object.values(invitationAccounts)
    .flat().some((account) => account.isExample);

  Object.entries(invitationAccounts).forEach(([side, accounts]) => {
    const list = document.querySelector(`#${side}-accounts`);
    list.replaceChildren();
    accounts.forEach((account) => {
      const displayName = accountNameOverrides[account.holder] || account.holder;
      const row = document.createElement('div');
      row.className = 'account-row';
      const info = document.createElement('div');
      const person = document.createElement('p');
      person.className = 'account-person';
      person.textContent = account.role;
      if (account.holder) {
        const name = document.createElement('strong');
        name.textContent = displayName;
        person.append(name);
      }
      const number = document.createElement('p');
      const hasAccount = Boolean(account.bank && account.number && account.holder);
      number.className = hasAccount ? 'account-number' : 'account-pending';
      number.textContent = hasAccount ? `${account.bank} ${account.number}` : '계좌 안내 준비 중';
      info.append(person, number);
      if (hasAccount && account.isExample) {
        const example = document.createElement('p');
        example.className = 'account-example';
        example.textContent = '예시 · 교체 필요';
        info.append(example);
      }
      row.append(info);
      if (hasAccount) {
        const copy = document.createElement('button');
        copy.className = 'copy-button';
        copy.type = 'button';
        copy.textContent = '복사';
        copy.dataset.copy = account.number.replace(/\D/g, '');
        copy.dataset.copyMessage = account.isExample
          ? '예시 계좌번호를 복사했습니다. 실제 계좌로 교체해 주세요.'
          : `${displayName}님의 계좌번호를 복사했습니다.`;
        copy.setAttribute('aria-label', `${account.role} ${displayName} 계좌번호 복사`);
        row.append(copy);
      }
      list.append(row);
    });
  });

  // name 속성을 지원하지 않는 브라우저에서도 한 그룹씩 펼쳐집니다.
  const groups = Array.from(document.querySelectorAll('.account-group'));
  groups.forEach((group) => group.addEventListener('toggle', () => {
    if (group.open) groups.forEach((other) => { if (other !== group) other.open = false; });
  }));

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    try {
      await copyText(button.dataset.copy);
      showToast(button.dataset.copyMessage || '복사했습니다.');
    } catch {
      showToast('복사가 지원되지 않는 환경입니다. 내용을 직접 복사해 주세요.');
    }
  });

  document.querySelector('#share-invitation').addEventListener('click', async () => {
    const localPreview = location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (localPreview) {
      showToast('공유할 수 있는 청첩장 주소가 아직 준비되지 않았습니다.');
      return;
    }
    const share = {
      title: '황두훈 · 이영서 결혼합니다',
      text: '2027년 1월 10일 일요일 오후 1시 · 서울대학교 호암교수회관 베리타스홀',
      url: location.href.split('#')[0],
    };
    try {
      if (navigator.share) {
        await navigator.share(share);
      } else {
        await copyText(share.url);
        showToast('청첩장 주소를 복사했습니다.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showToast('공유 기능을 사용할 수 없습니다. 주소를 직접 복사해 주세요.');
    }
  });
})();
