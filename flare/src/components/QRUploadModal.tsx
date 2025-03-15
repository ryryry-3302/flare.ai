import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

interface QRCodeUploadModalProps {
  onClose: () => void;
  onFileUploaded: (file: File, extractedText?: string) => void;
}

const QRCodeUploadModal: React.FC<QRCodeUploadModalProps> = ({ onClose, onFileUploaded }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'waiting' | 'uploading' | 'processing' | 'success' | 'error'>('waiting');
  const [networkIP, setNetworkIP] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Create a unique session ID when the modal opens and get network IP
  useEffect(() => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    
    // Get local network IP
    fetch('http://localhost:5000/api/get-ip')
      .then(response => response.json())
      .then(data => {
        if (data.ip) {
          setNetworkIP(data.ip);
        }
      })
      .catch(error => {
        console.error('Error fetching network IP:', error);
      });
    
    // Set up event source for file upload status updates
    const eventSource = new EventSource(`http://localhost:5000/api/upload-status/${newSessionId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.status === 'uploading') {
        setUploadStatus('uploading');
      } else if (data.status === 'processing') {
        setUploadStatus('processing');
        setStatusMessage(data.message || 'Processing...');
      } else if (data.status === 'success') {
        setUploadStatus('success');
        
        // For PDFs, we'll just use the extracted text without fetching the file
        if (data.extractedText) {
          // Create a dummy file for consistency with the API
          const dummyFile = new File([""], data.filename || "document.pdf");
          onFileUploaded(dummyFile, data.extractedText);
          setTimeout(() => onClose(), 1500);
        } else {
          // For images, fetch the uploaded file as before
          fetch(`http://localhost:5000/api/uploaded-file/${newSessionId}`)
            .then(response => response.blob())
            .then(blob => {
              const file = new File([blob], data.filename, { type: blob.type });
              onFileUploaded(file, data.extractedText);
              setTimeout(() => onClose(), 1500);
            })
            .catch(error => {
              console.error('Error fetching the uploaded file:', error);
              setUploadStatus('error');
            });
        }
      } else if (data.status === 'error') {
        setUploadStatus('error');
        setStatusMessage(data.message || 'An error occurred');
      }
    };
    
    eventSource.onerror = () => {
      console.error('EventSource failed');
      setUploadStatus('error');
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [onClose, onFileUploaded]);
  
  // Generate the upload URL with the session ID and network IP
  const serverUrl = networkIP 
    ? `http://${networkIP}:5000` // Use detected IP with Flask port
    : 'http://localhost:5000';  // Fallback to localhost
    
  const uploadUrl = sessionId ? `${serverUrl}/upload/${sessionId}` : '';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Upload Document</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <FaTimes className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          {uploadStatus === 'waiting' && (
            <>
              <div className="mb-4 text-center">
                <p className="text-slate-600 mb-6">
                  Scan this QR code with your mobile device to upload a photo or PDF
                </p>
                <div className="bg-white p-4 inline-block rounded-lg shadow-md">
                  {uploadUrl && <QRCodeSVG value={uploadUrl} size={200} />}
                </div>
                <p className="mt-2 text-xs text-slate-500 break-all">
                  {uploadUrl || 'Generating URL...'}
                </p>
                
                {/* Add button to open in new tab */}
                {uploadUrl && (
                  <button
                    onClick={() => window.open(uploadUrl, '_blank')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    Open in Browser
                  </button>
                )}
              </div>
              <div className="mt-4 text-sm text-slate-500 text-center">
                <p>1. Open your camera app</p>
                <p>2. Scan the QR code</p>
                <p>3. Select a photo or PDF to upload</p>
              </div>
            </>
          )}
          
          {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">
                {uploadStatus === 'uploading' ? 'Receiving your document...' : statusMessage}
              </p>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="py-8 text-center text-green-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Document processed successfully!</p>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="py-8 text-center text-red-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p>{statusMessage || 'Error uploading document. Please try again.'}</p>
              <button 
                onClick={() => setUploadStatus('waiting')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QRCodeUploadModal;