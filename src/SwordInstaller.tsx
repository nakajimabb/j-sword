import React, { useState, useEffect, useContext } from 'react';
import firebase from './firebase';
import 'firebase/firestore';
import 'firebase/storage';

import {
  Alert,
  Button,
  Form,
  Icon,
  Modal,
  Progress,
  Table,
  Tooltip,
} from './components';

import Sword from './sword/Sword';
import AppContext from './AppContext';
import { Module } from './types';
import './passage.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SwordInstaller: React.FC<Props> = ({ open, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<string[]>([]);
  const {
    currentUser,
    customClaims,
    bibles,
    dictionaries,
    morphologies,
    loadModules,
  } = useContext(AppContext);
  const langs: { [key: string]: string } = {
    ja: '日本語',
    he: 'ヘブル語',
    grc: 'ギリシャ語',
    en: '英語',
  };
  const modtypes: { [key: string]: string } = {
    bible: '聖書',
    dictionary: '辞書',
    morphology: '語形',
  };
  const installed_names = new Set(
    Object.keys(bibles).concat(
      Object.keys(dictionaries),
      Object.keys(morphologies)
    )
  );

  useEffect(() => {
    const f = async () => {
      const db = firebase.firestore();
      const role = customClaims?.role;
      try {
        const new_modules: Module[] = [];
        const secrecies = ['public'];
        if (role === 'admin') {
          secrecies.push('protected', 'private');
        } else if (role === 'manager') {
          secrecies.push('protected');
        }
        const querySnap = await db
          .collection('modules')
          .where('secrecy', 'in', secrecies)
          .orderBy('modtype')
          .orderBy('lang')
          .get();
        querySnap.forEach((doc) => {
          new_modules.push(doc.data() as Module);
        });
        setModules(new_modules);
      } catch (error) {
        console.log({ error });
        alert(error.message);
      }
    };
    f();
  }, [currentUser, customClaims]);

  const addTarget = (module: Module) => (
    e: React.ChangeEvent<{ value: unknown; checked: unknown }>
  ) => {
    let new_targets = Array.from(targets);
    if (e.target.checked) {
      new_targets.push(module.modname);
      if (module.dependencies)
        new_targets = new_targets.concat(module.dependencies);
    } else {
      new_targets = new_targets.filter((modname) => modname !== module.modname);
    }
    new_targets = new_targets.filter(
      (modname) => !installed_names.has(modname)
    );
    setTargets(new Set(new_targets));
  };

  const deleteTarget = (module: Module) => async () => {
    try {
      setLoading(true);
      const bible = bibles[module.modname];
      if (bible) bible.remove();
      const dictionary = dictionaries[module.modname];
      if (dictionary) dictionary.remove();
      const morphology = morphologies[module.modname];
      if (morphology) morphology.remove();
      await loadModules();
      setLoading(false);
    } catch (error) {
      console.log({ error });
      alert(error.message);
      setLoading(false);
    }
  };

  const blobFromUrl = (url: string) => {
    return new Promise<Blob | null>((resolve, reject) => {
      if (!url) reject(null);
      const storage = firebase.storage();
      var httpsReference = storage.refFromURL(url);
      httpsReference.getDownloadURL().then(function (url2) {
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = async () => {
          resolve(xhr.response);
        };
        xhr.open('GET', url2);
        xhr.send();
      });
    });
  };

  const download = async () => {
    const storage = firebase.storage();
    const target_modules = modules.filter((module) =>
      targets.has(module.modname)
    );
    setLoading(true);
    setProgress(0);
    setMessages([]);
    let count = 0;
    for await (let module of target_modules) {
      try {
        const pathReference = storage.ref(module.path);
        const url = await pathReference.getDownloadURL();
        const blob = await blobFromUrl(url);
        if (blob) {
          await Sword.install(blob, module.modtype, module.title);
          if (module.referencePath) {
            const pathReference2 = storage.ref(module.referencePath);
            const url2 = await pathReference2.getDownloadURL();
            const blob2 = await blobFromUrl(url2);
            const sword = await Sword.load(module.modname);
            if (blob2 && sword) await sword.installReference(blob2);
          }
        }
      } catch (error) {
        console.log({ error });
        setMessages((prev) => prev.concat(error.message));
      }
      count += 1;
      setProgress((100 * count) / target_modules.length);
    }
    setProgress(100);
    await loadModules();
    setTimeout(() => setLoading(false), 500);
  };

  const textColor = {
    bible: 'text-gray-600',
    dictionary: 'text-green-500',
    morphology: 'text-indigo-500',
  };

  return (
    <Modal open={open} onClose={onClose} size="7xl">
      <Modal.Header centered onClose={onClose}>
        モジュール ダウンロード
      </Modal.Header>
      <Modal.Body className="bg-gray-100">
        <Table hover={false} size="sm" className="mb-3">
          <Table.Body className="bg-gray-50">
            {modules.map((module, index) => (
              <Table.Row key={index} className={textColor[module.modtype]}>
                <Table.Cell>
                  <Form.Checkbox
                    value={module.modname}
                    disabled={installed_names.has(module.modname) || loading}
                    checked={
                      installed_names.has(module.modname) ||
                      targets.has(module.modname)
                    }
                    onChange={addTarget(module)}
                    className="mx-2 my-1"
                  />
                </Table.Cell>
                <Table.Cell>{module.title}</Table.Cell>
                <Table.Cell className="hidden sm:table-cell">
                  <small>{langs[module.lang]}</small>
                </Table.Cell>
                <Table.Cell className="hidden sm:table-cell">
                  <small>{modtypes[module.modtype]}</small>
                </Table.Cell>
                <Table.Cell>
                  {installed_names.has(module.modname) && (
                    <Tooltip title="削除する" className="text-left">
                      <Button
                        size="xs"
                        variant="icon"
                        color="none"
                        onClick={deleteTarget(module)}
                        className="mx-2 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-gray-400"
                      >
                        <Icon name="trash" />
                      </Button>
                    </Tooltip>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {loading && (
          <Progress value={progress} label={`${Math.round(progress)}%`} />
        )}
        {messages.length > 0 && (
          <Alert
            severity="error"
            onClose={() => setMessages([])}
            className="my-2"
          >
            {messages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </Alert>
        )}
        <div className="text-center">
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={download}
          >
            ダウンロード
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SwordInstaller;
