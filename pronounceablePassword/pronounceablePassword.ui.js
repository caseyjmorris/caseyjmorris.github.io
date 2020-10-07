(function() {
    let syllables = passwordDictionaries.asArrays.wholeLinuxWords;
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        handleClick();
        $('#generate').onclick = handleClick;
        $('#strategy-japanese').onclick = clickJapaneseSyllabary;
        $('#strategy-linux-word-parts').onclick = clickLinuxWordParts;
        $('#strategy-linux-word-whole').onclick = clickLinuxWordsWhole;
        $('#strategy-classic').onclick = handleClick;
        $('#strategy-linux-word-trigram').onclick = handleClick;
        $('#strategy-linux-word-digram').onclick = handleClick;
        $('#strategy-custom').onclick = clickOther;
        $('body').style.display = 'block';
    }

    function handleClick() {
        try {
            const isCustom = $('#strategy-custom').checked;
            $('#syllables-region').style.display = isCustom ? 'block' : 'none';
            const addDigit = $('#add-digit').checked;
            const addSymbol = $('#add-symbol').checked;
            const suffix = $('#suffix').value.trim();
            handleClickInternal(addDigit, addSymbol, suffix, isCustom);
        }
        catch (e) {
            console.log(e);
            alert(e.message);
        }
    }

    function handleClickInternal(addDigit, addSymbol, suffix, isCustom) {
        if (isCustom) {
            syllables = $('#syllables')
                .value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s !== '');
        }

        const minLength = parseInt($('#minimumLength').value, 10);

        let strategy = 'syllables';

        if ($('#strategy-linux-word-digram').checked) {
            strategy = 'markov2';
        }
        else if ($('#strategy-linux-word-whole').checked) {
            strategy = 'syllablesCamel';
        }
        else if ($('#strategy-linux-word-trigram').checked) {
            strategy = 'markov3';
        }
        else if ($('#strategy-classic').checked) {
            strategy = 'classic';
        }

        const words = Array.from({length: 20}, _ =>
            passwordGenerator.buildWord(strategy, minLength, syllables, addDigit, addSymbol, suffix));

        $('#password').innerHTML = '';

        for (let word of words) {
            const htmlEscaped = htmlEscape(word);
            const rating = zxcvbn(word);
            const score = rating.score;
            console.log(rating);
            $('#password').innerHTML +=
                `<tr class="password">
                             <td class="rating rating-${score}">${score}/4</td>
                             <td class="password-value">${htmlEscaped}</td>
                             <td><button type="button" class="password-copy-button">Copy to clipboard</button></td>`;
        }

        Array.from($$('.password-copy-button'))
            .forEach(el => el.onclick = () =>
                navigator.clipboard
                    .writeText(el.closest('.password').querySelector('.password-value').innerText.trim()));
    }

    function clickJapaneseSyllabary() {
        hideSyllablesRegion();
        syllables = passwordDictionaries.asArrays.japaneseSyllabary;
        $('#syllables').innerHTML = passwordDictionaries.asStrings.japaneseSyllabary;
        handleClick();
    }

    function clickLinuxWordParts() {
        hideSyllablesRegion();
        syllables = passwordDictionaries.asArrays.linuxWordParts;
        $('#syllables').innerHTML = passwordDictionaries.asStrings.linuxWordParts;
        handleClick();
    }

    function clickLinuxWordsWhole() {
        hideSyllablesRegion();
        syllables = passwordDictionaries.asArrays.wholeLinuxWords;
        $('#syllables').innerHTML = passwordDictionaries.asStrings.wholeLinuxWords;
        handleClick();
    }

    function hideSyllablesRegion() {
        $('#syllables-region').style.display = 'none';
    }

    function clickOther() {
        $('#syllables-region').style.display = 'block';
    }

    function htmlEscape(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
    }
}());