import React, { useRef, useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import {
  ErrorMessage, Field, Form, Formik,
} from 'formik';
import * as Yup from 'yup';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import SocketInstanceContext from '../../context/SocketInstanceContext.jsx';
import { actions } from '../../slices';
import ackWithTimeout from '../../utils';

const ModalAddChannel = () => {
  const { t } = useTranslation();
  const socket = useContext(SocketInstanceContext);
  const TYPE = 'addChannel';
  const inputRef = useRef(null);
  const channels = useSelector((state) => state.channelsInfo.channels);
  const isOpen = useSelector((state) => state.modal.isOpen);
  const modalType = useSelector((state) => state.modal.type);
  const channelsNames = channels.map(({ name }) => name);
  const dispatch = useDispatch();

  const validationSchema = Yup.object().shape({
    channelName: Yup.string()
      .trim()
      .required()
      .notOneOf(channelsNames)
      .minmax(3, 20),
  });

  const initialValues = {
    channelName: '',
  };

  const onSuccessSend = (resetForm, setSubmitting, setFieldError) => ({ status, data }) => {
    if (status === 'ok') {
      dispatch(actions.setCurrentChannel({ id: data.id }));
      resetForm();
      dispatch(actions.closeModal());
    } else {
      setFieldError('channelName', t('errors.networkError'));
      setSubmitting(false);
    }
  };

  const onFailSend = (setSubmitting, setFieldError) => () => {
    inputRef.current.focus();
    setSubmitting(false);
    setFieldError('channelName', t('errors.networkError'));
  };

  const submitHandler = (formData, {
    resetForm, setFieldError, setSubmitting,
  }) => {
    setSubmitting(true);
    const name = formData.channelName;
    socket.volatile.emit('newChannel', { name }, ackWithTimeout(
      onSuccessSend(resetForm, setSubmitting, setFieldError),
      onFailSend(setSubmitting, setFieldError),
      2500,
    ));
  };

  const hideHandler = () => {
    dispatch(actions.closeModal());
  };

  const showHandler = () => {
    inputRef.current.focus();
  };

  const cancelHandler = (resetForm) => () => {
    resetForm();
    dispatch(actions.closeModal());
  };

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={submitHandler}
    >
      {({
        errors, touched, submitForm, isSubmitting, resetForm,
      }) => (
        <Modal
          show={isOpen && modalType === TYPE}
          onShow={showHandler}
          onHide={hideHandler}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{t('ui.channels.addTitle')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Field
                name="channelName"
                innerRef={inputRef}
                disabled={isSubmitting}
                autoComplete="off"
                data-testid="add-channel"
                className={`form-control ${errors.channelName && touched.channelName && 'is-invalid'}`}
              />
              <ErrorMessage className="invalid-tooltip" name="channelName" component="div" />
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button onClick={cancelHandler(resetForm)} variant="secondary">{t('ui.channels.cancel')}</Button>
            <Button onClick={submitForm} variant="primary" type="submit" disabled={isSubmitting}>{t('ui.channels.send')}</Button>
          </Modal.Footer>
        </Modal>
      )}
    </Formik>
  );
};

export default ModalAddChannel;
