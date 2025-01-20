import newRules from '../rules/rules.json'

function getMaxLoc(obj) {
    let keyWithMaxValue = null;
    let maxValue = 0;
    for (const [key, value] of Object.entries(obj)) {
        if (value > maxValue) {
            keyWithMaxValue = key;
            maxValue = value;
        }
    }
    if (maxValue === 0) {
        return "None";
    }
    // Capitaliza a primeira letra de keyWithMaxValue
    if (keyWithMaxValue !== null) {
        keyWithMaxValue = keyWithMaxValue.charAt(0).toUpperCase() + keyWithMaxValue.slice(1);
    }
    return keyWithMaxValue;
}

class DeclassifyService {
    constructor() {
    }

    async classify(url) {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const title = await this.getDocumentTitle(url, pdf)
        const classificationsOccurances = await this.countClassificationsOccurances(pdf);
        const results = this.generateResults(classificationsOccurances);
        return {
            title, results, classificationsOccurances
        };
    }

    async getDocumentTitle (url, pdf){
        const metadata = await pdf.getMetadata();
        const fileName = url.split('/').pop();
        return metadata.info.Title || fileName
    }

    countClassificationOccurrances(classification, text) { // Categoria 1
        const occurrences = {[classification]: {}};
        for (const [key, rules] of Object.entries(newRules[classification])) {
            occurrences[classification][key] = this.countOccurrences(text, rules);
        }
        return occurrences;
    }

    async countClassificationsOccurances(pdf) {
        const classifications = {}
        for (const classification in newRules) {
            classifications[classification] = {}
            for (const key in newRules[classification]) {
                classifications[classification][key] = 0
            }
        }
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await this.getPageText(page);
            for (const classification of Object.keys(newRules)) {
                const occurrences = this.countClassificationOccurrances(classification, text);
                for (const key in classifications[classification]) {
                    classifications[classification][key] += occurrences[classification][key];
                }
            }
        }
        return classifications
    }

    countOccurrences(text, array) {
        return array.reduce((acc, subString) => {
            const regex = new RegExp(subString, "gi");
            const matches = text.match(regex);

            if (matches) {
                return acc + matches.length
            }
            return acc
        }, 0);
    }

    generateResults(classificationsOccurances) {
        const results = {};
        for (const classification in classificationsOccurances) {
            results[classification] = getMaxLoc(classificationsOccurances[classification]);
        }
        return results;
    }

    async getPageText(page) {
        const pageTextContent = await page.getTextContent();
        return this.extractNormalizedText(pageTextContent);
    }

    extractNormalizedText(pageTextContent) {
        const text = this.extractText(pageTextContent);
        return this.normalizeText(text);
    }

    extractText(pageTextContent) {
        return pageTextContent.items.reduce((acc, item) => {
            return acc + item.str;
        }, "");
    }

    normalizeText(text) {
        text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        text = text.toLowerCase();
        text = text.replace(/[^a-z\n\t\-]+/g, " ");
        text = text.replace(/[" ]+/g, " ");
        return text;
    }
}


export default DeclassifyService