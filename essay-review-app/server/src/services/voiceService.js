const express = require('express');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

const voiceService = express.Router();
const client = new TextToSpeechClient();

// Function to convert text to speech
voiceService.post('/synthesize', async (req, res) => {
    const { text, voiceParams } = req.body;

    const request = {
        input: { text: text },
        voice: voiceParams,
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        const audioFilePath = `./audio/${Date.now()}.mp3`;
        await writeFile(audioFilePath, response.audioContent, 'binary');
        res.status(200).json({ audioFilePath });
    } catch (error) {
        console.error('Error synthesizing speech:', error);
        res.status(500).json({ error: 'Failed to synthesize speech' });
    }
});

// Function to get available voices
voiceService.get('/voices', async (req, res) => {
    try {
        const [result] = await client.listVoices({});
        res.status(200).json(result.voices);
    } catch (error) {
        console.error('Error fetching voices:', error);
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});

module.exports = voiceService;