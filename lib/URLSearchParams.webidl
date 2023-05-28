[Exposed=(Window,Worker)]
interface URLSearchParams {
  constructor(optional (sequence<sequence<USVString>> or record<USVString, USVString> or USVString) init = "");

  readonly attribute unsigned long size;

  void append(USVString name, USVString value);
  void delete(USVString name, optional USVString value);
  USVString? get(USVString name);
  sequence<USVString> getAll(USVString name);
  boolean has(USVString name, optional USVString value);
  void set(USVString name, USVString value);

  void sort();

  iterable<USVString, USVString>;
  stringifier;
};
