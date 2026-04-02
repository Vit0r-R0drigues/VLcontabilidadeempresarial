document.addEventListener('DOMContentLoaded', () => {
    const currentYear = String(new Date().getFullYear());

    document.querySelectorAll('#current-year, #currentYear, [data-current-year]').forEach((element) => {
        element.textContent = currentYear;
    });
});
