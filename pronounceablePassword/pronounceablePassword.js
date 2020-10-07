(function() {
    const byteArray = new Uint32Array(20);
    let byteArrayPos = 20;
    const symbols = '!@#$%^&*()-_=+,./<>?~`\\|[]{};:"\'';
    let syllables = passwordDictionaries.asArrays.wholeLinuxWords;
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    const markovCache = {};

    setTimeout(init, 500);

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

        const words = Array.from({length: 20}, _ => buildWord(strategy, minLength, syllables, addDigit, addSymbol, suffix));

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

    function getCachedMarkovChain(length) {
        markovCache[length] = markovCache[length] ||
            buildMarkovChain(
                passwordDictionaries.asArrays.wholeLinuxWords, length);
        return markovCache[length];
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

    /***
     * @param {string} strategy
     * @param {number} minimumLength
     * @param {Array<string>} syllables
     * @param {boolean} addDigit
     * @param {boolean} addSymbol
     * @param {string} suffix
     */
    function buildWord(strategy, minimumLength, syllables, addDigit, addSymbol, suffix) {
        let word;
        if (strategy === 'syllables') {
            word =  buildWordFromSyllables(minimumLength, syllables, false);
        }
        else if (strategy === 'syllablesCamel') {
            word =  buildWordFromSyllables(minimumLength, syllables, true);
        }
        else if (strategy === 'classic') {
            word = buildClassicPassword(minimumLength);
        }
        else if (strategy === 'markov2') {
            word = buildMarkovPseudoWord(minimumLength, getCachedMarkovChain(2));
        }
        else if (strategy === 'markov3') {
            word = buildMarkovPseudoWord(minimumLength, getCachedMarkovChain(3));
        }
        else {
            throw new Error(`Unknown strategy ${strategy}`);
        }

        if (strategy !== 'classic') {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }

        if (addDigit) {
            word += (randomNumber() % 10).toString();
        }
        if (addSymbol) {
            word += symbols.charAt(randomNumber() % symbols.length);
        }
        if (suffix) {
            word += suffix;
        }

        return word;
    }

    /***
     * Build a non-pronounceable password
     * @param {number} length
     * @returns {string}
     */
    function buildClassicPassword(length) {
        let result = '';
        while (result.length < length) {
            result += String.fromCharCode((randomNumber() % 93) + 33);
        }

        return result;
    }

    /***
     * build a word from random syllables
     * @param minimumLength {number} minimum size
     * @param {Array<string>} syllables possible syllables
     * @param {boolean} camel
     * @returns {string}
     */
    function buildWordFromSyllables(minimumLength, syllables, camel) {
        let result = '';
        while (result.length < minimumLength) {
            const idx = randomNumber() % syllables.length;
            let chosen = syllables[idx];
            if (camel) {
                chosen = chosen.charAt(0).toUpperCase() + chosen.slice(1);
            }
            result += chosen;
        }

        return result;
    }

    /***
     * Build a Markov chain from words
     * @param {Array<string>} words
     * @param {number} gramLen
     * @return {Object}
     */
    function buildMarkovChain(words, gramLen) {
        const dict = {};
        const enders = new Set();
        dict[''] = [];
        for (let letter of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
            dict[letter] = [];
        }

        for (let word of words) {
            if (word.length < gramLen) {
                continue;
            }
            dict[''].push(word.substr(0, gramLen));
            enders.add(word.substr(word.length - gramLen, gramLen));
            for (let i = 0; i < word.length - gramLen; i++) {
                const currentLetter = word.charAt(i);
                if (!dict.hasOwnProperty(currentLetter)) {
                    i = word.length;
                    continue;
                }
                dict[currentLetter].push(word.substr(i + 1, gramLen));
            }
        }

        dict.isEnder = arg => {
            let result = enders.has(arg);
            if (!result) {console.log(`Can't end with non-word-ending ngram ${arg}`);}
            return result;
        }
        dict.gramLen = gramLen;

        return dict;
    }

    function buildMarkovPseudoWord(length, markovChain) {
        let result = '';
        let last = '';
        while (result.length < length ||
        !markovChain.isEnder(result.substr(result.length - markovChain.gramLen, markovChain.gramLen))) {
            const possibilities = markovChain[last];
            result += possibilities[randomNumber() % possibilities.length];
            last = result.charAt(result.length - 1);
        }

        return result;
    }

    /***
     * Get CSPR number
     * @returns {number}
     */
    function randomNumber() {
        if (byteArrayPos === 20) {
            byteArrayPos = 0;
            crypto.getRandomValues(byteArray);
        }

        return byteArray[byteArrayPos++];
    }
}());