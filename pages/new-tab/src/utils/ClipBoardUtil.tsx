const copyToClipboard = async ({
  text,
  onSuccess,
  onError,
}: {
  text: string;
  onSuccess?: () => void;
  onError?: () => void;
}) => {
  try {
    await navigator.clipboard.writeText(text);
    if (onSuccess) {
      onSuccess();
    } else {
      console.log('Text copied to clipboard successfully!');
    }
  } catch (err) {
    if (onError) {
      onError();
    } else {
      console.error('Failed to copy text: ', err);
    }
  }
};

export default {
  copyToClipboard,
};
