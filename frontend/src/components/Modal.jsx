export default function Modal({ wide = false, children }) {
  return (
    <div className="modal-bg">
      <div className={'card modal' + (wide ? ' wide' : '')}>{children}</div>
    </div>
  );
}
