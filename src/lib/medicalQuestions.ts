import { MedicalQuestion } from './types';

export const DEFAULT_MEDICAL_QUESTIONS: MedicalQuestion[] = [
  { id: 'mq1', question: 'Has the applicant been treated for any heart, lung, kidney or liver condition?', answer: '', remarks: '' },
  { id: 'mq2', question: 'Has the applicant been diagnosed with diabetes, hypertension or high cholesterol?', answer: '', remarks: '' },
  { id: 'mq3', question: 'Has the applicant undergone any surgery in the last 5 years?', answer: '', remarks: '' },
  { id: 'mq4', question: 'Is the applicant currently on any medication?', answer: '', remarks: '' },
  { id: 'mq5', question: 'Has any insurance application been declined, postponed or modified?', answer: '', remarks: '' },
  { id: 'mq6', question: 'Does the applicant smoke or consume alcohol regularly?', answer: '', remarks: '' },
  { id: 'mq7', question: 'Has the applicant had any disability or chronic illness?', answer: '', remarks: '' },
  { id: 'mq8', question: 'Is the applicant engaged in any hazardous occupation or sport?', answer: '', remarks: '' },
];
