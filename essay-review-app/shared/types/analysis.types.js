export const ToneTypes = {
    FORMAL: 'formal',
    INFORMAL: 'informal',
    PERSUASIVE: 'persuasive',
    NARRATIVE: 'narrative',
    DESCRIPTIVE: 'descriptive',
};

export const ErrorTypes = {
    GRAMMATICAL: 'grammatical',
    PUNCTUATION: 'punctuation',
    STYLE: 'style',
    TONE: 'tone',
};

export const AnalysisMetrics = {
    READABILITY: 'readability',
    COHERENCE: 'coherence',
    ENGAGEMENT: 'engagement',
    VOCABULARY_DIVERSITY: 'vocabulary_diversity',
    TONE_ADHERENCE: 'tone_adherence',
};

export const CommonMistakes = {
    RUN_ON_SENTENCES: {
        description: 'Run-on sentences occur when two or more independent clauses are connected improperly.',
        examples: [
            'I love to write I think it is fun.',
            'She enjoys reading she does not have much time.'
        ],
        corrections: [
            'I love to write; I think it is fun.',
            'She enjoys reading, but she does not have much time.'
        ],
    },
    FRAGMENT_SENTENCES: {
        description: 'Sentence fragments are incomplete sentences that lack a subject or verb.',
        examples: [
            'When I went to the store.',
            'Because I was tired.'
        ],
        corrections: [
            'When I went to the store, I bought some milk.',
            'I went to bed early because I was tired.'
        ],
    },
};

export const OverusedWords = {
    VERY: {
        frequency: 10,
        alternatives: ['extremely', 'really', 'incredibly'],
    },
    GOOD: {
        frequency: 15,
        alternatives: ['excellent', 'great', 'superb'],
    },
};