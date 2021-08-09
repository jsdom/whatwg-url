[Exposed=(Window,Worker)]
interface URLSearchParams {
  constructor(optional (sequence<sequence<USVString>> or record<USVString, USVString> or USVString) init = "");

  void append(USVString name, USVString value);
  void delete(USVString name);
  USVString? get(USVString name);
  sequence<USVString> getAll(USVString name);
  boolean has(USVString name);
  void set(USVString name, USVString value);

  void sort();

  iterable<USVString, USVString>;
  stringifier;
};
