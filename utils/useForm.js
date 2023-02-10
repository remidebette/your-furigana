import {useState} from 'react';

const useForm = (initialState, callback) => {

  const [formValues, setFormValues] = useState(initialState);

  const handleFormChange = (event) => {
    event.persist();
    setFormValues(values => ({ ...values, [event.target.name]: event.target.value }));
  };

  const handleFormSubmit = (event) => {
    if (event) event.preventDefault();
      callback();
  };

  return {
    handleFormChange,
    handleFormSubmit,
    formValues,
    setFormValues
  }
};

export default useForm;