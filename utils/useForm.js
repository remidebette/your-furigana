import {useState} from 'react';

const useForm = (initialState, callback) => {

  const [values, setValues] = useState(initialState);

  const handleChange = (event) => {
    event.persist();
    setValues(values => ({ ...values, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    if (event) event.preventDefault();
      callback();
  };

  return {
    handleChange,
    handleSubmit,
    values,
    setValues
  }
};

export default useForm;