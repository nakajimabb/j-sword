import React, { useState, useContext } from 'react';
import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/storage';

import { Alert, Button, Flex, Form, Modal } from './components';

import AppContext from './AppContext';
import './passage.css';

interface Props {
  open: boolean;
  docId: string | null;
  onClose: () => void;
}

const BookForm: React.FC<Props> = ({ open, docId, onClose }) => {
  const [value, setValue] = useState<{ title: string; published: boolean }>({
    title: '',
    published: false,
  });
  const { currentUser, customClaims } = useContext(AppContext);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser) {
      try {
        const db = firebase.firestore();
        // 社員情報保存
        await db.collection('books').add({
          ...value,
          displayName: currentUser.displayName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.log({ error });
        alert(error.message || 'エラーが発生しました。');
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <Modal.Header centered onClose={onClose}>
        ブックを追加
      </Modal.Header>
      <Modal.Body className="bg-gray-100">
        <Form onSubmit={save} className="flex flex-col space-y-2">
          <Form.Text
            value={value.title}
            required
            placeholder="タイトル"
            onChange={(e) => setValue({ ...value, title: e.target.value })}
            className="w-72"
          ></Form.Text>
          <Form.Checkbox
            checked={value.published}
            label="公開する"
            onChange={(e) => {
              setValue({ ...value, published: e.target.checked });
            }}
          />
          <Flex className="justify-end space-x-2">
            <Button variant="outlined" color="secondary" onClick={onClose}>
              ｷｬﾝｾﾙ
            </Button>
            <Button variant="contained" color="primary">
              登録
            </Button>
          </Flex>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default BookForm;
