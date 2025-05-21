import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
        question: "What is an active developer?",
        answer: (
          <p>
            An active developer is any developer who has commited at least once in the last 30 days to any repo submitted to the {' '}
            <a 
              href="https://github.com/electric-capital/crypto-ecosystems" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Electric Capital repo
            </a>
            .
          </p>
        )
      },
    {
      question: "Which repos are being considered?",
      answer: (
        <p>
          Any repo that has been submitted and is currently on the{' '}
          <a 
            href="https://github.com/electric-capital/crypto-ecosystems" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Electric Capital repo
          </a>
          {' '}should be there. If your repo was recently submitted you might have to wait until it's been processed correctly.
        </p>
      )
    },
    {
        question: "What are the criteria for being recognized as a top contributor?",
        answer: (
          <p>
            In order to be recognized as a top contributor, you must have commited to any repo which is open-sourced and submitted to the {' '}
            <a 
              href="https://github.com/electric-capital/crypto-ecosystems" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Electric Capital repo
            </a>
            . Algorand Foundation and Algorand Devs repos are not eligible for this recognition, except if they contributions are to personal repos.
          </p>
        )
      },
      {
        question: "How often is the dashboard updated?",
        answer: (
          <p>
            The dashboard is updated every 24 hours. However, if the repo has been just added, it might take a few hours to be processed.
          </p>
        )
      },
      {
        question: "Is private repo activity considered?",
        answer: (
          <p>
            Private repo activity is not considered. Only public repos and submitted to the Electric Capital repo are considered.
          </p>
        )
      },
    {
      question: "How do I submit a new repo to EC?",
      answer: (
        <p>
          In order to add a new repo to EC and start being tracked your repo should be open-source and then you should create a PR. You can check this{' '}
          <a 
            href="https://www.loom.com/share/796443942026471581fb531d1dd31a26?sid=3533a455-329c-4936-8ffb-6b312249b4fd" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            guide
          </a>
          {' '}to see the full process.
        </p>
      )
    },
    {
      question: "Why should I open-source my repo?",
      answer: (
        <p>
          Open-sourcing your repository can lead to faster innovation, community contributions, and broader adoption. 
          It allows others to review your code, suggest improvements, and even help fix bugs or add features. 
          Open source also increases transparency, builds credibility, and can help you grow your professional reputation.
        </p>
      )
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full px-6 py-4 text-left focus:outline-none"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {item.question}
                </h2>
                <svg
                  className={`w-6 h-6 transform transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>
            <div
              className={`transition-all duration-200 ease-in-out ${
                openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              } overflow-hidden`}
            >
              <div className="px-6 pb-4 text-gray-700 dark:text-gray-300">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ; 