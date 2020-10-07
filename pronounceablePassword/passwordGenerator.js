(function () {
    const byteArray = new Uint32Array(20);
    let byteArrayPos = 20;
    const symbols = '!@#$%^&*()-_=+,./<>?~`\\|[]{};:"\'';
    const markovCache = {};

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

    function getCachedMarkovChain(length) {
        markovCache[length] = markovCache[length] ||
            buildMarkovChain(
                passwordDictionaries.asArrays.wholeLinuxWords, length);
        return markovCache[length];
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

    window.passwordGenerator = Object.freeze({buildWord: buildWord});
})();