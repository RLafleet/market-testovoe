document.addEventListener('DOMContentLoaded', () => {
  initBurger();
  initSelectionHelper();
  initActionButtons();
});

function initBurger() {
  const burger = document.querySelector('.burger');
  const menuGroup = document.querySelector('.frame-group');

  if (!burger || !menuGroup) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('is-active');
    menuGroup.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });
}

function initSelectionHelper() {
  const selectionSection = document.querySelector('.selection-support');
  if (!selectionSection) return;

  const form = selectionSection.querySelector('.frame-section');
  const submitButton = selectionSection.querySelector('.frame-button');
  const checkboxes = selectionSection.querySelectorAll('.checkbox-input');
  const stepItems = selectionSection.querySelectorAll('.parent2 i');
  const navDots = selectionSection.querySelectorAll(
    '.nav-dots, .nav-dots2, .nav-dots3'
  );

  if (checkboxes.length) {
    checkboxes.forEach((input) => {
      const checkboxLabel = input.closest('.checkbox');

      updateCheckboxState(input, checkboxLabel);

      input.addEventListener('change', () => {
        updateCheckboxState(input, checkboxLabel);
        updateSelectionState();
      });
    });
  }

  if (submitButton) {
    submitButton.addEventListener('click', (event) => {
      event.preventDefault();

      const checkedInputs = selectionSection.querySelectorAll(
        '.checkbox-input:checked'
      );

      if (!checkedInputs.length) {
        selectionSection.classList.add('has-error');
        return;
      }

      selectionSection.classList.remove('has-error');
      selectionSection.classList.add('is-step-complete');

      if (stepItems[1]) {
        stepItems[1].classList.add('is-active');
      }

      if (navDots[1]) {
        navDots[1].classList.add('is-active');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  }

  function updateSelectionState() {
    const checkedInputs = selectionSection.querySelectorAll(
      '.checkbox-input:checked'
    );

    if (checkedInputs.length > 0) {
      selectionSection.classList.add('has-selection');
      selectionSection.classList.remove('has-error');
    } else {
      selectionSection.classList.remove('has-selection');
    }

    if (stepItems[0]) {
      stepItems[0].classList.add('is-active');
    }

    if (navDots[0]) {
      navDots[0].classList.add('is-active');
    }
  }

  updateSelectionState();
}

function updateCheckboxState(input, checkboxLabel) {
  if (!input || !checkboxLabel) return;

  checkboxLabel.classList.toggle('is-checked', input.checked);
  checkboxLabel.classList.toggle('is-focused', input.matches(':focus-visible'));

  input.addEventListener('focus', () => {
    checkboxLabel.classList.add('is-focused');
  });

  input.addEventListener('blur', () => {
    checkboxLabel.classList.remove('is-focused');
  });
}

function initActionButtons() {
  const cartButtons = document.querySelectorAll('.cart-button');
  const orderButtons = document.querySelectorAll('.component-1');
  const calcButtons = document.querySelectorAll('.button, .button4');
  const measureButton = document.querySelector('.button2');

  cartButtons.forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.add('is-added');

      setTimeout(() => {
        button.classList.remove('is-added');
      }, 1000);
    });
  });

  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.add('is-clicked');

      setTimeout(() => {
        button.classList.remove('is-clicked');
      }, 300);
    });
  });

  calcButtons.forEach((button) => {
    button.addEventListener('click', () => {
      console.log('Открыть калькулятор');
    });
  });

  if (measureButton) {
    measureButton.addEventListener('click', () => {
      console.log('Открыть форму замера');
    });
  }
}