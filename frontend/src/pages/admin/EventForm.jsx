// Create a new event, or edit a locked one (/admin/events/:id/edit)
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';

// variantsText = varieties typed as "Black, White, Blue"
// variantImages / variantFiles = photo per variety, keyed by variety name: existing URL / newly picked { file, preview }
const newItem = () => ({
  name: '', brand: '', price: '', originalPrice: '', quantity: 100, description: '', variantsText: '', image: '', file: null, preview: '',
  variantImages: {}, variantFiles: {},
});
const splitVariants = (text) => text.split(',').map((v) => v.trim()).filter(Boolean);

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time
function toLocalInput(iso) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EventForm() {
  const { id: editId } = useParams(); // present when editing
  const navigate = useNavigate();
  const toast = useToast();

  const [fields, setFields] = useState({ name: '', description: '', goLiveAt: '', endsAt: '' });
  const [coverImage, setCoverImage] = useState(''); // existing cover URL (edit mode)
  const [coverFile, setCoverFile] = useState(null); // newly picked file
  const [items, setItems] = useState(editId ? [] : [newItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // ---------- Edit mode: load the event ----------
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { event } = await api('/events/' + editId);
        if (event.status !== 'locked') {
          toast('Only locked events can be edited.', 'error');
          return setTimeout(() => navigate('/admin'), 1500);
        }
        setFields({
          name: event.name,
          description: event.description,
          goLiveAt: toLocalInput(event.goLiveAt),
          endsAt: event.endsAt ? toLocalInput(event.endsAt) : '',
        });
        setCoverImage(event.coverImage);
        setItems(
          event.items.map((i) => ({
            ...newItem(),
            name: i.name,
            brand: i.brand || '',
            price: i.price,
            originalPrice: i.originalPrice ?? '',
            quantity: i.quantity,
            description: i.description || '',
            variantsText: (i.variants || []).join(', '),
            variantImages: Object.fromEntries((i.variants || []).map((v, j) => [v, i.variantImages?.[j] || ''])),
            image: i.image,
          }))
        );
      } catch (err) {
        toast(err.message, 'error');
      }
    })();
  }, [editId, navigate, toast]);

  // ---------- Items ----------
  const updateItem = (i, change) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...change } : it)));

  function removeItem(i) {
    if (items.length === 1) return toast('An event needs at least one item.', 'error');
    setItems((list) => list.filter((_, j) => j !== i));
  }

  function pickItemImage(i, file) {
    if (file) updateItem(i, { file, preview: URL.createObjectURL(file) });
  }

  function pickVariantImage(i, variant, file) {
    if (file) updateItem(i, { variantFiles: { ...items[i].variantFiles, [variant]: { file, preview: URL.createObjectURL(file) } } });
  }

  // ---------- Save (create or update) ----------
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    // FormData lets us send text and image files together
    const data = new FormData();
    data.append('name', fields.name);
    data.append('description', fields.description);
    data.append('goLiveAt', new Date(fields.goLiveAt).toISOString());
    data.append('endsAt', fields.endsAt ? new Date(fields.endsAt).toISOString() : '');
    data.append('coverImage', coverImage);
    if (coverFile) data.append('cover', coverFile);
    data.append(
      'items',
      JSON.stringify(
        items.map(({ name, brand, price, originalPrice, quantity, description, variantsText, variantImages, image }) => {
          const variants = splitVariants(variantsText);
          return { name, brand, price, originalPrice, quantity, description, variants, variantImages: variants.map((v) => variantImages[v] || ''), image };
        })
      )
    );
    items.forEach((it, i) => {
      if (it.file) data.append('itemImage_' + i, it.file);
      splitVariants(it.variantsText).forEach((v, j) => {
        if (it.variantFiles[v]) data.append(`variantImage_${i}_${j}`, it.variantFiles[v].file);
      });
    });

    try {
      if (editId) await api('/admin/events/' + editId, { method: 'PUT', form: data });
      else await api('/admin/events', { method: 'POST', form: data });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const field = (name) => ({ name, value: fields[name], onChange: (e) => setFields({ ...fields, [name]: e.target.value }) });
  const coverUrl = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : coverImage), [coverFile, coverImage]);
  const previewStyle = (url) => (url ? { backgroundImage: `url('${url}')` } : undefined);

  return (
    <AdminLayout>
      <form className="card card-pad" onSubmit={submit}>
        <h1 className="page-title">{editId ? 'Edit sale' : 'Create a new sale'}</h1>
        <p className="muted small" style={{ marginBottom: 20 }}>
          New sales start <strong>Locked</strong> and open automatically at the go-live time.
        </p>

        <div className="form-group">
          <label>Sale name</label>
          <input required placeholder="Tech Essentials Flash Sale" {...field('name')} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={2} placeholder="Limited time offers on top tech products." {...field('description')} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Go-live date & time</label>
            <input type="datetime-local" required {...field('goLiveAt')} />
          </div>
          <div className="form-group">
            <label>Ends at <span className="muted">(optional – shows a "Sale ends in" timer)</span></label>
            <input type="datetime-local" min={fields.goLiveAt || undefined} {...field('endsAt')} />
          </div>
        </div>

        <div className="form-group">
          <label>Cover Photo</label>
          <label className="img-pick cover-pick" htmlFor="cover" style={previewStyle(coverUrl)}>
            {!coverUrl && 'Click to choose a cover image'}
          </label>
          <input type="file" id="cover" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files[0] || null)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '26px 0 12px' }}>
          <h2>Products</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setItems((list) => [...list, newItem()])}>
            + Add product
          </button>
        </div>
        <p className="muted small" style={{ marginBottom: 10 }}>
          Image · Name · Brand · Sale price · Normal price (optional, shows the discount) · Quantity (100–500) · Description · Varieties
        </p>

        {items.map((it, i) => {
          const url = it.preview || it.image;
          return (
            <div key={i} className="card item-editor">
              <label className="img-pick" htmlFor={'file-' + i} style={previewStyle(url)}>
                {!url && '+ Image'}
              </label>
              <input type="file" id={'file-' + i} accept="image/*" className="hidden" onChange={(e) => pickItemImage(i, e.target.files[0])} />
              <input placeholder="Product name" required value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} aria-label="Product name" />
              <input placeholder="Brand" maxLength={60} value={it.brand} onChange={(e) => updateItem(i, { brand: e.target.value })} aria-label="Brand" />
              <input type="number" step="0.01" min="1" placeholder="Sale price (Rs.)" required value={it.price} onChange={(e) => updateItem(i, { price: e.target.value })} aria-label="Sale price" />
              <input type="number" step="0.01" min="1" placeholder="Normal price" value={it.originalPrice} onChange={(e) => updateItem(i, { originalPrice: e.target.value })} aria-label="Normal price" />
              <input type="number" min="100" max="500" placeholder="Qty" required value={it.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>
                ✕
              </button>
              <div className="item-extra">
                <textarea
                  rows={2}
                  maxLength={1000}
                  placeholder="Description – what is it, size, material… (customers can read this before the sale opens)"
                  value={it.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                />
                <input
                  placeholder="Varieties, comma separated (optional) – e.g. Black, White, Blue"
                  value={it.variantsText}
                  onChange={(e) => updateItem(i, { variantsText: e.target.value })}
                />
              </div>
              {splitVariants(it.variantsText).length > 0 && (
                <div className="variant-photos">
                  <span className="muted small">Photo for each variety (optional – customers see it when they pick that colour):</span>
                  {splitVariants(it.variantsText).map((v) => {
                    const vUrl = it.variantFiles[v]?.preview || it.variantImages[v];
                    const inputId = `vfile-${i}-${v}`;
                    return (
                      <div key={v} className="variant-photo">
                        <label className="img-pick img-pick-sm" htmlFor={inputId} style={previewStyle(vUrl)}>
                          {!vUrl && '+'}
                        </label>
                        <input type="file" id={inputId} accept="image/*" className="hidden" onChange={(e) => pickVariantImage(i, v, e.target.files[0])} />
                        <span className="small">{v}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="form-error" style={{ marginTop: 14 }}>{error}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin" className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={saving}>
            {editId ? 'Save changes' : 'Create sale'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
